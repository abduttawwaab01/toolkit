import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";
import { z } from "zod";

const DEFAULT_BANK: {
  id: string;
  accountName: string;
  accountNo: string;
  bankName: string;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
} = {
  id: "",
  accountName: "Odebunmi Tawwab",
  accountNo: "9033460322",
  bankName: "Palmpay",
  isActive: true,
  metadata: {},
  createdAt: "",
  updatedAt: "",
};

export async function GET() {
  const bankDetail = await db.bankDetail.findFirst({
    where: { isActive: true },
  });

  if (!bankDetail) {
    return jsonResponse(DEFAULT_BANK);
  }

  return jsonResponse(bankDetail);
}

const postSchema = z.object({
  accountName: z.string().min(1),
  accountNo: z.string().min(1),
  bankName: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return jsonResponse({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { accountName, accountNo, bankName } = parsed.data;

  // Delete existing active bank detail and create new one
  await db.bankDetail.deleteMany({ where: { isActive: true } });

  const bankDetail = await db.bankDetail.create({
    data: { accountName, accountNo, bankName },
  });

  return jsonResponse(bankDetail, { status: 201 });
}
