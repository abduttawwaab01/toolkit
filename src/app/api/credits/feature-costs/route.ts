import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";
import { z } from "zod";

export async function GET() {
  const costs = await db.featureCreditCost.findMany();
  return jsonResponse(costs);
}

const putItemSchema = z.object({
  featureKey: z.string().min(1),
  featureLabel: z.string().min(1),
  creditsCost: z.number().int().min(0),
  isEnabled: z.boolean(),
  description: z.string().optional(),
});

const putSchema = z.array(putItemSchema);

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return jsonResponse({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const items = parsed.data;

  const results = await Promise.all(
    items.map((item) =>
      db.featureCreditCost.upsert({
        where: { featureKey: item.featureKey },
        update: {
          featureLabel: item.featureLabel,
          creditsCost: item.creditsCost,
          isEnabled: item.isEnabled,
          description: item.description || null,
        },
        create: {
          featureKey: item.featureKey,
          featureLabel: item.featureLabel,
          creditsCost: item.creditsCost,
          isEnabled: item.isEnabled,
          description: item.description || null,
        },
      }),
    ),
  );

  return jsonResponse(results);
}
