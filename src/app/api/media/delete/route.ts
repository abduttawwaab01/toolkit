import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteFile } from "@/lib/r2";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const { fileId } = await req.json();
    if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 });
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const file = await db.projectFile.findUnique({ where: { id: fileId } });
    if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });
    if (file.userId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Delete from R2
    await deleteFile(file.storagePath);

    // Delete from DB
    await db.projectFile.delete({ where: { id: fileId } });
    const user = await db.user.findUnique({ where: { id: userId } });
    const newStorage = Math.max(0, (user?.storageUsed || 0) - Number(file.size));
    await db.user.update({ where: { id: userId }, data: { storageUsed: newStorage } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
