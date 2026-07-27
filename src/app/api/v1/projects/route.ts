import { db } from "@/lib/db";
import { withApiAuth } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";

export const GET = withApiAuth(async (req, auth) => {
  const { allowed } = await checkRateLimit(auth.userId, "api", auth.role);
  if (!allowed) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429 });

  const projects = await db.project.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, type: true, status: true, createdAt: true, updatedAt: true, thumbnailUrl: true },
  });

  return new Response(JSON.stringify({ data: projects }), {
    headers: { "Content-Type": "application/json" },
  });
});

export const POST = withApiAuth(async (req, auth) => {
  const { allowed } = await checkRateLimit(auth.userId, "api", auth.role);
  if (!allowed) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429 });

  const body = await req.json();
  const project = await db.project.create({
    data: {
      userId: auth.userId,
      name: body.name || "Untitled Project",
      type: body.type || "video",
      metadata: body.metadata || {},
    },
  });

  return new Response(JSON.stringify({ data: project }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
});
