import { db } from "@/lib/db";
import { withApiAuth } from "@/lib/api-auth";

export const GET = withApiAuth(async (req, auth) => {
  const keys = await db.apiKey.findMany({
    where: { userId: auth.userId },
    select: { id: true, name: true, scopes: true, lastUsed: true, createdAt: true, expiresAt: true },
  });

  return new Response(JSON.stringify({ data: keys }), {
    headers: { "Content-Type": "application/json" },
  });
});

export const POST = withApiAuth(async (req, auth) => {
  const body = await req.json();
  const rawKey = `tkit_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;

  const apiKey = await db.apiKey.create({
    data: {
      userId: auth.userId,
      name: body.name || "API Key",
      key: rawKey,
      scopes: JSON.stringify(body.scopes || ["read"]),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  });

  return new Response(JSON.stringify({ data: { id: apiKey.id, key: rawKey, name: apiKey.name } }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
});

export const DELETE = withApiAuth(async (req, auth) => {
  const body = await req.json();
  await db.apiKey.deleteMany({
    where: { id: body.id, userId: auth.userId },
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
