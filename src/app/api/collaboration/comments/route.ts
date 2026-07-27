import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";

// GET: List comments for a project
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const comments = await db.comment.findMany({
      where: { projectId, parentId: null },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        replies: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a comment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { projectId, content, timeCode, parentId } = body;

    if (!projectId || !content?.trim()) {
      return NextResponse.json({ error: "projectId and content required" }, { status: 400 });
    }

    // Verify access
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const isOwner = project.userId === userId;
    const isCollaborator = await db.projectCollaborator.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!isOwner && !isCollaborator && !project.isShared) {
      return NextResponse.json({ error: "No access to this project" }, { status: 403 });
    }

    const comment = await db.comment.create({
      data: {
        projectId,
        userId,
        content: content.trim(),
        timeCode: timeCode ?? null,
        parentId: parentId ?? null,
      },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });

    await db.projectActivity.create({
      data: {
        projectId,
        userId,
        action: "commented",
        entity: "comment",
        entityId: comment.id,
        details: { timeCode, preview: content.slice(0, 100) },
      },
    });

    return NextResponse.json({ comment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Resolve/unresolve a comment
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { commentId, resolved } = body;
    if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });

    const comment = await db.comment.update({
      where: { id: commentId },
      data: { resolved: resolved ?? true },
    });

    return NextResponse.json({ comment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a comment
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");
    if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });

    const comment = await db.comment.findUnique({ where: { id: commentId } });
    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

    // Allow owner of comment or project owner to delete
    const project = await db.project.findUnique({ where: { id: comment.projectId } });
    if (comment.userId !== userId && project?.userId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await db.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
