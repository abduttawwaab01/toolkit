import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/r2";
import { scheduleAutoDelete } from "@/lib/auto-delete";
import { maybeRunCleanup } from "@/lib/cleanup";
import { jsonResponse } from "@/lib/json";

const MAX_FILE_SIZE = BigInt(524288000);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const userId = req.headers.get("x-user-id") || req.nextUrl.searchParams.get("userId");
  const role = req.headers.get("x-user-role") || "GUEST";
  const isGuest = !userId || role === "GUEST";

  // Check if guest uploads are allowed
  if (isGuest) {
    try {
      const allowGuest = await db.platformSetting.findUnique({ where: { key: "allowGuestUploads" } });
      if (allowGuest?.value === "false") {
        return jsonResponse({ error: "Guest uploads are disabled" }, { status: 403 });
      }
    } catch {
      return jsonResponse({ error: "Guest uploads are disabled" }, { status: 403 });
    }
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string | null;

    if (!file) return jsonResponse({ error: "No file provided" }, { status: 400 });

    // Enforce file size limit
    if (BigInt(file.size) > MAX_FILE_SIZE) {
      return jsonResponse({ error: "File size exceeds limit of 500 MB" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `${isGuest ? "guest" : userId}/${crypto.randomUUID()}-${file.name}`;

    // Determine user (create ephemeral guest record if needed)
    let effectiveUserId = userId;
    if (isGuest) {
      let guest = await db.user.findFirst({ where: { role: "GUEST", isSuspended: false, adminNotes: `ip:${ip}` } });
      if (!guest) {
        guest = await db.user.create({ data: { role: "GUEST", creditsBalance: 3, storageLimit: BigInt(104857600), adminNotes: `ip:${ip}` } });
      }
      effectiveUserId = guest.id;
    }

    if (!effectiveUserId) return jsonResponse({ error: "Could not identify user" }, { status: 400 });

    // Atomic storage update: only increment if under limit
    const storageLimit = BigInt(1073741824);
    const updateResult = await db.user.updateMany({
      where: {
        id: effectiveUserId,
        storageUsed: { lt: storageLimit - BigInt(buffer.length) },
      },
      data: { storageUsed: { increment: buffer.length } },
    });

    if (updateResult.count === 0) {
      return jsonResponse({ error: "Storage limit exceeded. Maximum is 1 GB." }, { status: 507 });
    }

    // Upload to R2
    const { url } = await uploadFile(key, buffer, file.type);

    // Save metadata
    const projectFile = await db.projectFile.create({
      data: {
        userId: effectiveUserId,
        projectId,
        category: "RAW",
        storagePath: key,
        originalName: file.name,
        mimeType: file.type,
        size: buffer.length,
      },
    });

    // Schedule auto-deletion
    await scheduleAutoDelete(projectFile.id);

    // Trigger cleanup check (runs at most every 5 min)
    await maybeRunCleanup();

    return jsonResponse({ id: projectFile.id, url, name: file.name, size: buffer.length, autoDeleteAt: projectFile.autoDeleteAt });
  } catch (error) {
    console.error("Upload error:", error);
    return jsonResponse({ error: "Upload failed" }, { status: 500 });
  }
}
