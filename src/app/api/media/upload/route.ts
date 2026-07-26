import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/r2";
import { scheduleAutoDelete } from "@/lib/auto-delete";
import { jsonResponse } from "@/lib/json";

export const maxDuration = 60;

const MAX_FILE_SIZE = 524288000;

export async function POST(req: NextRequest) {
  const headerUserId = req.headers.get("x-user-id") || req.nextUrl.searchParams.get("userId");
  const role = req.headers.get("x-user-role") || "GUEST";

  if (role === "GUEST" && !headerUserId) {
    return jsonResponse(
      { error: "Guest uploads are handled in the browser. Please sign up for persistent storage." },
      { status: 403 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const formUserId = formData.get("userId") as string | null;
    const projectId = formData.get("projectId") as string | null;
    const effectiveUserId = headerUserId || formUserId;

    if (!file) return jsonResponse({ error: "No file provided" }, { status: 400 });
    if (BigInt(file.size) > BigInt(MAX_FILE_SIZE)) {
      return jsonResponse({ error: "File size exceeds limit of 500 MB" }, { status: 413 });
    }

    if (!effectiveUserId) return jsonResponse({ error: "Could not identify user" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `${effectiveUserId}/${crypto.randomUUID()}-${file.name}`;

    // Atomic storage check + increment
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

    scheduleAutoDelete(projectFile.id).catch(() => {});

    return jsonResponse({
      id: projectFile.id,
      url,
      name: file.name,
      size: buffer.length,
      autoDeleteAt: projectFile.autoDeleteAt,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return jsonResponse({ error: "Upload failed" }, { status: 500 });
  }
}
