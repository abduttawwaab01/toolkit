import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";

// GET: Get all active presences for a project
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const presences = await db.userPresence.findMany({
      where: {
        projectId,
        lastActive: { gte: fiveMinutesAgo },
      },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });

    return NextResponse.json({ presences });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Update own presence
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { projectId, cursorPos } = body;

    const presence = await db.userPresence.upsert({
      where: { userId },
      update: {
        projectId: projectId || null,
        lastActive: new Date(),
        cursorPos: cursorPos || undefined,
      },
      create: {
        userId,
        projectId: projectId || null,
        lastActive: new Date(),
        cursorPos: cursorPos || undefined,
      },
    });

    return NextResponse.json({ presence });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Clear own presence (leaving project)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await db.userPresence.deleteMany({ where: { userId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
