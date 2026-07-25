import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/r2";
import { scheduleAutoDelete } from "@/lib/auto-delete";
import { checkRateLimit, getRateLimitForRole, getPlatformSetting } from "@/lib/rate-limit";
import { jsonResponse } from "@/lib/json";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const userId = req.headers.get("x-user-id") || req.nextUrl.searchParams.get("userId");
  const role = req.headers.get("x-user-role") || "GUEST";
  const isGuest = !userId || role === "GUEST";

  // Check if guest uploads are allowed
  if (isGuest) {
    const allowGuest = await getPlatformSetting("allowGuestUploads");
    if (allowGuest === "false") {
      return jsonResponse({ error: "Guest uploads are disabled" }, { status: 403 });
    }
  }

  // Rate limit check
  const rl = await checkRateLimit(`upload:${isGuest ? ip : userId}`, role);
  if (!rl.success) return jsonResponse({ error: "Rate limit exceeded. Try again later." }, { status: 429 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string | null;

    if (!file) return jsonResponse({ error: "No file provided" }, { status: 400 });

    // Get role limits from DB
    const limits = await getRateLimitForRole(role);

    // Enforce file size limit
    if (BigInt(file.size) > limits.maxFileSize) {
      const maxMb = Number(limits.maxFileSize / BigInt(1048576));
      return jsonResponse({ error: `File size exceeds limit of ${maxMb} MB for your role` }, { status: 413 });
    }

    // Enforce allowed MIME types (if configured)
    if (limits.allowedMimeTypes) {
      const allowed = limits.allowedMimeTypes.split(",").map((t: string) => t.trim());
      if (!allowed.includes(file.type)) {
        return jsonResponse({ error: `File type "${file.type}" is not allowed for your role` }, { status: 415 });
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `${isGuest ? "guest" : userId}/${crypto.randomUUID()}-${file.name}`;

    // Determine user (create ephemeral guest record if needed)
    let effectiveUserId = userId;
    if (isGuest) {
      // Use IP-based guest user or create a new one per IP
      let guest = await db.user.findFirst({ where: { role: "GUEST", isSuspended: false, adminNotes: `ip:${ip}` } });
      if (!guest) {
        guest = await db.user.create({ data: { role: "GUEST", creditsBalance: 3, storageLimit: BigInt(104857600), adminNotes: `ip:${ip}` } });
      }
      effectiveUserId = guest.id;
    }

    if (!effectiveUserId) return jsonResponse({ error: "Could not identify user" }, { status: 400 });

    // Enforce storage limit with atomic check-and-increment to prevent race conditions
    const user = await db.user.findUnique({ where: { id: effectiveUserId } });
    if (!user) return jsonResponse({ error: "User not found" }, { status: 404 });

    const userLimit = user.maxProjects !== null && user.maxProjects !== undefined
      ? BigInt(user.maxProjects)
      : limits.maxStoragePerUser;

    // Atomic storage update: only increment if under limit
    const updateResult = await db.user.updateMany({
      where: {
        id: effectiveUserId,
        storageUsed: { lt: userLimit - BigInt(buffer.length) },
      },
      data: { storageUsed: { increment: buffer.length } },
    });

    if (updateResult.count === 0) {
      const usedMb = Number(user.storageUsed / BigInt(1048576));
      const limitMb = Number(userLimit / BigInt(1048576));
      return jsonResponse({ error: `Storage limit exceeded. Used: ${usedMb}MB / ${limitMb}MB` }, { status: 507 });
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

    return jsonResponse({ id: projectFile.id, url, name: file.name, size: buffer.length, autoDeleteAt: projectFile.autoDeleteAt });
  } catch (error) {
    console.error("Upload error:", error);
    return jsonResponse({ error: "Upload failed" }, { status: 500 });
  }
}
