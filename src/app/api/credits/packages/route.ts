import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";
import { z } from "zod";

export async function GET() {
  const packages = await db.creditPackage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return jsonResponse(packages);
}

const postSchema = z.object({
  name: z.string().min(1),
  credits: z.number().int().min(1).max(10000),
  priceNaira: z.number().int().min(100).max(1000000),
  bonusCredits: z.number().int().min(0).max(1000).default(0),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return jsonResponse({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, credits, priceNaira, bonusCredits, description } = parsed.data;

  const maxSort = await db.creditPackage.findMany({
    select: { sortOrder: true },
    orderBy: { sortOrder: "desc" },
    take: 1,
  });

  const nextSort = maxSort.length > 0 ? maxSort[0].sortOrder + 1 : 0;

  const pkg = await db.creditPackage.create({
    data: {
      name,
      credits,
      priceNaira,
      bonusCredits,
      description: description || null,
      sortOrder: nextSort,
    },
  });

  return jsonResponse(pkg, { status: 201 });
}

const putSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  credits: z.number().int().min(1).max(10000),
  priceNaira: z.number().int().min(100).max(1000000),
  bonusCredits: z.number().int().min(0).max(1000),
  description: z.string().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0),
});

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return jsonResponse({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, name, credits, priceNaira, bonusCredits, description, isActive, sortOrder } = parsed.data;

  const pkg = await db.creditPackage.update({
    where: { id },
    data: {
      name,
      credits,
      priceNaira,
      bonusCredits,
      description: description || null,
      isActive,
      sortOrder,
    },
  });

  return jsonResponse(pkg);
}
