import { db } from "@/lib/db";
import { withApiAuth } from "@/lib/api-auth";

export const GET = withApiAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const onlyPublic = searchParams.get("public") !== "false";

  const where: any = {};
  if (onlyPublic) where.isPublic = true;
  if (category) where.category = category;

  const templates = await db.communityTemplate.findMany({
    where,
    orderBy: [{ likes: "desc" }, { usageCount: "desc" }],
    take: 50,
    include: { author: { select: { name: true } } },
  });

  return new Response(JSON.stringify({ data: templates }), {
    headers: { "Content-Type": "application/json" },
  });
});

export const POST = withApiAuth(async (req, auth) => {
  const body = await req.json();
  const template = await db.communityTemplate.create({
    data: {
      name: body.name,
      description: body.description,
      thumbnailUrl: body.thumbnailUrl,
      trackData: body.trackData,
      authorId: auth.userId,
      category: body.category,
      isPublic: body.isPublic ?? true,
    },
  });

  return new Response(JSON.stringify({ data: template }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
});
