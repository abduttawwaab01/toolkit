import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";

// GET: List collaborators for a project
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const collaborators = await db.projectCollaborator.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });

    return NextResponse.json({ collaborators });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Invite a collaborator
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { projectId, email, role } = body;

    if (!projectId || !email) {
      return NextResponse.json({ error: "projectId and email required" }, { status: 400 });
    }

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (project.userId !== userId) {
      return NextResponse.json({ error: "Only the project owner can invite collaborators" }, { status: 403 });
    }

    const invitee = await db.user.findUnique({ where: { email } });
    if (!invitee) return NextResponse.json({ error: "User not found with that email" }, { status: 404 });

    const existing = await db.projectCollaborator.findUnique({
      where: { projectId_userId: { projectId, userId: invitee.id } },
    });
    if (existing) return NextResponse.json({ error: "Already a collaborator" }, { status: 409 });

    const collaborator = await db.projectCollaborator.create({
      data: {
        projectId,
        userId: invitee.id,
        role: role || "editor",
        invitedBy: userId,
      },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });

    await db.projectActivity.create({
      data: {
        projectId,
        userId,
        action: "invited",
        entity: "collaborator",
        entityId: invitee.id,
        details: { email, role: role || "editor" },
      },
    });

    return NextResponse.json({ collaborator });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a collaborator
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const collaboratorId = searchParams.get("collaboratorId");
    if (!projectId || !collaboratorId) {
      return NextResponse.json({ error: "projectId and collaboratorId required" }, { status: 400 });
    }

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (project.userId !== userId) {
      return NextResponse.json({ error: "Only the project owner can remove collaborators" }, { status: 403 });
    }

    await db.projectCollaborator.delete({
      where: { projectId_userId: { projectId, userId: collaboratorId } },
    });

    await db.projectActivity.create({
      data: {
        projectId,
        userId,
        action: "removed",
        entity: "collaborator",
        entityId: collaboratorId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Toggle project sharing / update share link
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { projectId, isShared } = body;
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (project.userId !== userId) {
      return NextResponse.json({ error: "Only the project owner can change sharing" }, { status: 403 });
    }

    const shareLink = isShared && !project.shareLink
      ? crypto.randomUUID()
      : project.shareLink;

    const updated = await db.project.update({
      where: { id: projectId },
      data: { isShared: isShared ?? !project.isShared, shareLink },
    });

    return NextResponse.json({ project: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
