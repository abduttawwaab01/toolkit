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
  creditsPerExport: z.number().int().min(0).optional(),
  creditsPerMinute: z.number().int().min(0).optional(),
});

function platformKey(role: string, field: string) {
  return `export_limit_${role}_${field}`;
}

async function getExportLimits(role: string) {
  const getInt = async (key: string, fallback: number) => {
    try {
      const s = await prisma.platformSetting.findUnique({ where: { key } });
      return s ? parseInt(s.value, 10) || fallback : fallback;
    } catch { return fallback; }
  };
  const defaults: Record<string, { perDay: number; perWeek: number; perMonth: number; perYear: number; perExport: number; perMinute: number }> = {
    GUEST: { perDay: 1, perWeek: 3, perMonth: 5, perYear: 30, perExport: 2, perMinute: 2 },
    USER: { perDay: 3, perWeek: 15, perMonth: 50, perYear: 500, perExport: 1, perMinute: 1 },
    ADMIN: { perDay: 9999, perWeek: 9999, perMonth: 9999, perYear: 9999, perExport: 0, perMinute: 0 },
  };
  const d = defaults[role] || defaults.USER;
  return {
    role,
    freeExportsPerDay: await getInt(platformKey(role, "freePerDay"), d.perDay),
    freeExportsPerWeek: await getInt(platformKey(role, "freePerWeek"), d.perWeek),
    freeExportsPerMonth: await getInt(platformKey(role, "freePerMonth"), d.perMonth),
    freeExportsPerYear: await getInt(platformKey(role, "freePerYear"), d.perYear),
    creditsPerExport: await getInt(platformKey(role, "creditsPerExport"), d.perExport),
    creditsPerMinute: await getInt(platformKey(role, "creditsPerMinute"), d.perMinute),
  };
}

export async function GET() {
  try {
    const roles = ["GUEST", "USER", "ADMIN"];
    const rules = await Promise.all(roles.map(getExportLimits));
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
    const labels: Record<string, string> = {
      freePerDay: "Free Exports Per Day",
      freePerWeek: "Free Exports Per Week",
      freePerMonth: "Free Exports Per Month",
      freePerYear: "Free Exports Per Year",
      creditsPerExport: "Credits Per Export",
      creditsPerMinute: "Credits Per Minute",
    };

    for (const [field, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const key = platformKey(targetRole, field);
        await prisma.platformSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value), label: `${targetRole} - ${labels[field] || field}`, category: "export-limits", type: "number" },
        });
      }
    }

    return jsonResponse(await getExportLimits(targetRole));
  } catch {
    return jsonResponse({ error: "Failed to update export limits" }, { status: 500 });
  }
}
