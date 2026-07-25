import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return jsonResponse({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  const where: any = {};
  if (status !== "all") {
    where.status = status;
  }

  const [requests, total] = await Promise.all([
    db.creditPurchaseRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        package: true,
      },
    }),
    db.creditPurchaseRequest.count({ where }),
  ]);

  return jsonResponse({
    requests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

const putSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  adminNotes: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return jsonResponse({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, action, adminNotes } = parsed.data;

  const request = await db.creditPurchaseRequest.findUnique({ where: { id } });
  if (!request) {
    return jsonResponse({ error: "Request not found" }, { status: 404 });
  }

  if (request.status !== "PENDING") {
    return jsonResponse({ error: "Request has already been reviewed" }, { status: 400 });
  }

  if (action === "approve") {
    const [updatedRequest] = await db.$transaction([
      db.creditPurchaseRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedBy: admin.userId,
          reviewedAt: new Date(),
          adminNotes: adminNotes || null,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          package: true,
        },
      }),
      db.user.update({
        where: { id: request.userId },
        data: { creditsBalance: { increment: request.credits } },
      }),
      db.creditSpendLog.create({
        data: {
          userId: request.userId,
          feature: "purchase",
          credits: request.credits,
          reason: "purchase approved",
          balance: 0,
        },
      }),
    ]);

    await logAdminAction(
      admin.userId,
      "credit-request.approved",
      "credit-request",
      id,
      { userId: request.userId, credits: request.credits, amountNaira: request.amountNaira },
      req.headers.get("x-forwarded-for") || undefined,
    );

    return jsonResponse(updatedRequest);
  }

  // Reject
  const updatedRequest = await db.creditPurchaseRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      reviewedBy: admin.userId,
      reviewedAt: new Date(),
      adminNotes: adminNotes || null,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      package: true,
    },
  });

  await logAdminAction(
    admin.userId,
    "credit-request.rejected",
    "credit-request",
    id,
    { userId: request.userId, credits: request.credits, amountNaira: request.amountNaira, adminNotes },
    req.headers.get("x-forwarded-for") || undefined,
  );

  return jsonResponse(updatedRequest);
}
