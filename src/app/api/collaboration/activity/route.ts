import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";

// GET: List activities for a project
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const activities = await db.projectActivity.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    });

    return NextResponse.json({ activities });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
