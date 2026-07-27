import { db } from "@/lib/db";
import { withApiAuth } from "@/lib/api-auth";

export const POST = withApiAuth(async (req, auth, { params }: { params: { id: string } }) => {
  const template = await db.communityTemplate.findUnique({ where: { id: params.id } });
  if (!template) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  await db.communityTemplate.update({
    where: { id: params.id },
    data: { likes: { increment: 1 } },
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
