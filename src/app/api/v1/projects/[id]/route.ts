import { db } from "@/lib/db";
import { withApiAuth } from "@/lib/api-auth";

export const GET = withApiAuth(async (req, auth, { params }: { params: { id: string } }) => {
  const project = await db.project.findFirst({
    where: { id: params.id, userId: auth.userId },
    include: { files: { where: { deletedAt: null } } },
  });

  if (!project) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  return new Response(JSON.stringify({ data: project }), {
    headers: { "Content-Type": "application/json" },
  });
});

export const PATCH = withApiAuth(async (req, auth, { params }: { params: { id: string } }) => {
  const body = await req.json();
  const project = await db.project.updateMany({
    where: { id: params.id, userId: auth.userId },
    data: { name: body.name, metadata: body.metadata, thumbnailUrl: body.thumbnailUrl },
  });

  return new Response(JSON.stringify({ data: project }), {
    headers: { "Content-Type": "application/json" },
  });
});

export const DELETE = withApiAuth(async (req, auth, { params }: { params: { id: string } }) => {
  await db.project.deleteMany({
    where: { id: params.id, userId: auth.userId },
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
