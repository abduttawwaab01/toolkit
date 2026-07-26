import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSignedUploadUrl, getPublicUrl } from "@/lib/r2";
import { scheduleAutoDelete } from "@/lib/auto-delete";
import { maybeRunCleanup } from "@/lib/cleanup";

const MAX_FILE_SIZE = 524288000;

export async function POST(req: NextRequest) {
  try {
    const { fileName, mimeType, fileSize, projectId } = await req.json();
    const userId = req.headers.get("x-user-id") || req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }
    if (!fileName || !mimeType) {
      return NextResponse.json({ error: "fileName and mimeType required" }, { status: 400 });
    }
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds limit of 500 MB" }, { status: 413 });
    }

    const storageLimit = 1073741824;
    const user = await db.user.findUnique({ where: { id: userId }, select: { storageUsed: true } });
    if (user && Number(user.storageUsed) + fileSize > storageLimit) {
      return NextResponse.json({ error: "Storage limit exceeded. Maximum is 1 GB." }, { status: 507 });
    }

    const key = `${userId}/${crypto.randomUUID()}-${fileName}`;
    const uploadUrl = await getSignedUploadUrl(key, mimeType, 3600);

    const projectFile = await db.projectFile.create({
      data: {
        userId,
        projectId,
        category: "RAW",
        storagePath: key,
        originalName: fileName,
        mimeType,
        size: fileSize,
      },
    });

    await db.user.update({
      where: { id: userId },
      data: { storageUsed: { increment: fileSize } },
    });

    await scheduleAutoDelete(projectFile.id);
    await maybeRunCleanup();

    return NextResponse.json({
      id: projectFile.id,
      uploadUrl,
      publicUrl: getPublicUrl(key),
      name: fileName,
      size: fileSize,
      autoDeleteAt: projectFile.autoDeleteAt,
    });
  } catch (error) {
    console.error("Upload URL error:", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
