import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { jsonResponse } from "@/lib/json";
import { z } from "zod";

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return { userId: (session.user as any).id as string };
}

const postSchema = z.object({
  feature: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { feature } = parsed.data;

  const featureCost = await db.featureCreditCost.findUnique({
    where: { featureKey: feature },
  });

  if (!featureCost || !featureCost.isEnabled) {
    return jsonResponse({ error: "Feature not found or disabled" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: auth.userId } });
  if (!user) {
    return jsonResponse({ error: "User not found" }, { status: 404 });
  }

  if (user.creditsBalance < featureCost.creditsCost) {
    return jsonResponse(
      { error: "Insufficient credits", creditsBalance: user.creditsBalance, creditsRequired: featureCost.creditsCost },
      { status: 402 },
    );
  }

  const [updatedUser] = await db.$transaction([
    db.user.update({
      where: { id: auth.userId },
      data: { creditsBalance: { decrement: featureCost.creditsCost } },
    }),
    db.creditSpendLog.create({
      data: {
        userId: auth.userId,
        feature,
        credits: featureCost.creditsCost,
        reason: null,
        balance: user.creditsBalance - featureCost.creditsCost,
      },
    }),
  ]);

  return jsonResponse({
    success: true,
    creditsSpent: featureCost.creditsCost,
    newBalance: updatedUser.creditsBalance,
  });
}
