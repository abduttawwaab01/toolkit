import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { jsonResponse } from "@/lib/json";
import { z } from "zod";

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return { userId: (session.user as any).id as string, role: (session.user as any).role as string };
}

const createBodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().default("general"),
  content: z.any().default({}),
  format: z.enum(["rich", "markdown", "text", "html"]).default("rich"),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";

  const where: any = { isPublic: true };
  if (category) {
    where.category = category;
  }

  const templates = await db.documentTemplate.findMany({
    where,
    orderBy: { usageCount: "desc" },
  });

  return jsonResponse({ templates });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, description, category, content, format } = parsed.data;

  const template = await db.documentTemplate.create({
    data: {
      name,
      description: description || null,
      category,
      content,
      format,
      isPublic: true,
    },
  });

  return jsonResponse(template, { status: 201 });
}
