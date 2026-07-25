import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { jsonResponse } from "@/lib/json";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const updateSchema = z.object({
  role: z.string(),
  freeExportsPerDay: z.number().int().min(0).optional(),
  freeExportsPerWeek: z.number().int().min(0).optional(),
  freeExportsPerMonth: z.number().int().min(0).optional(),
  freeExportsPerYear: z.number().int().min(0).optional(),
  creditsPerExport: z.number().int().min(1).optional(),
  creditsPerMinute: z.number().int().min(1).optional(),
});

export async function GET() {
  try {
    const rules = await prisma.rateLimitRule.findMany({
      select: {
        role: true,
        freeExportsPerDay: true,
        freeExportsPerWeek: true,
        freeExportsPerMonth: true,
        freeExportsPerYear: true,
        creditsPerExport: true,
        creditsPerMinute: true,
      },
    });
    return jsonResponse({ rules });
  } catch {
    return jsonResponse({ error: "Failed to fetch export limits" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (role !== "ADMIN") {
    return jsonResponse({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { role: targetRole, ...updates } = parsed.data;
    const updated = await prisma.rateLimitRule.update({
      where: { role: targetRole },
      data: updates,
      select: {
        role: true,
        freeExportsPerDay: true,
        freeExportsPerWeek: true,
        freeExportsPerMonth: true,
        freeExportsPerYear: true,
        creditsPerExport: true,
        creditsPerMinute: true,
      },
    });

    return jsonResponse(updated);
  } catch {
    return jsonResponse({ error: "Failed to update export limits" }, { status: 500 });
  }
}
