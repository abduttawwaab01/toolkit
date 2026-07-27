import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSignedUploadUrl } from "@/lib/r2";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { name, contentType, size, userId, projectId } = await req.json();
    if (!name || !contentType || !size || !userId) {
      return NextResponse.json({ error: "Missing required fields: name, contentType, size, userId" }, { status: 400 });
    }

    const fileSize = BigInt(size);
    const MAX_FILE_SIZE = BigInt(524288000);
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds limit of 500 MB" }, { status: 413 });
    }

    // Atomic storage check before issuing the presigned URL
    const storageLimit = BigInt(1073741824);
    const updateResult = await db.user.updateMany({
      where: {
        id: userId,
        storageUsed: { lt: storageLimit - fileSize },
      },
      data: { storageUsed: { increment: Number(size) } },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: "Storage limit exceeded. Maximum is 1 GB." }, { status: 507 });
    }

    const key = `${userId}/${crypto.randomUUID()}-${name}`;
    const uploadUrl = await getSignedUploadUrl(key, contentType, 3600);
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    const projectFile = await db.projectFile.create({
      data: {
        userId,
        projectId: projectId || null,
        category: "RAW",
        storagePath: key,
        originalName: name,
        mimeType: contentType,
        size: fileSize,
      },
    });

    return NextResponse.json({
      id: projectFile.id,
      key,
      uploadUrl,
      publicUrl,
      name,
    });
  } catch (error: any) {
    console.error("Presign error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate upload URL" }, { status: 500 });
  }
}
