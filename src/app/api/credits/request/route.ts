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

export async function GET() {
  const auth = await requireAuth();
  if (!auth) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

  const requests = await db.creditPurchaseRequest.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    include: { package: true },
  });

  return jsonResponse(requests);
}

const postSchema = z.object({
  packageId: z.string().optional(),
  credits: z.number().int().min(1).max(10000),
  amountNaira: z.number().int().min(0),
  accountName: z.string().min(1),
  reference: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { packageId, credits, amountNaira, accountName, reference } = parsed.data;

  let finalCredits = credits;
  let finalAmount = amountNaira;

  if (packageId) {
    const pkg = await db.creditPackage.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.isActive) {
      return jsonResponse({ error: "Invalid or inactive package" }, { status: 400 });
    }
    finalCredits = pkg.credits + pkg.bonusCredits;
    finalAmount = pkg.priceNaira;
  }

  const request = await db.creditPurchaseRequest.create({
    data: {
      userId: auth.userId,
      packageId: packageId || null,
      credits: finalCredits,
      amountNaira: finalAmount,
      accountName,
      reference: reference || null,
      status: "PENDING",
    },
    include: { package: true },
  });

  return jsonResponse(request, { status: 201 });
}
