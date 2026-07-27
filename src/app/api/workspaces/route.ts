import { db } from "@/lib/db";
import { withApiAuth } from "@/lib/api-auth";

export const GET = withApiAuth(async (req, auth) => {
  const workspaces = await db.workspace.findMany({
    where: { ownerId: auth.userId },
    include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });

  return new Response(JSON.stringify({ data: workspaces }), {
    headers: { "Content-Type": "application/json" },
  });
});

export const POST = withApiAuth(async (req, auth) => {
  const body = await req.json();

  const workspace = await db.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: { name: body.name, ownerId: auth.userId, plan: body.plan || "FREE" },
    });

    await tx.workspaceMember.create({
      data: { workspaceId: ws.id, userId: auth.userId, role: "OWNER" },
    });

    return ws;
  });

  return new Response(JSON.stringify({ data: workspace }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
});
