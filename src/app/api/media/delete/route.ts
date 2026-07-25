import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteFile } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const { fileId, userId } = await req.json();
    if (!fileId || !userId) return NextResponse.json({ error: "fileId and userId required" }, { status: 400 });

    const file = await db.projectFile.findUnique({ where: { id: fileId } });
    if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });
    if (file.userId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Delete from R2
    await deleteFile(file.storagePath);

    // Delete from DB
    await db.projectFile.delete({ where: { id: fileId } });
    await db.user.update({ where: { id: userId }, data: { storageUsed: { decrement: file.size } } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
