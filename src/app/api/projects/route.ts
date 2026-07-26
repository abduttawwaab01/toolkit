import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId") || req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const projectId = req.nextUrl.searchParams.get("id");
    if (projectId) {
      const project = await db.project.findUnique({ where: { id: projectId } });
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
      if (project.userId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      return NextResponse.json(project);
    }

    const projects = await db.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Project load error:", error);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}
