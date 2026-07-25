import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";

const DOCUMENT_PLATFORM_KEYS = [
  "documentFeatureEnabled",
  "documentConversionsEnabled",
  "documentDefaultFormat",
  "documentAutoSaveInterval",
  "documentMaxVersions",
];

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return jsonResponse({ error: "Forbidden" }, { status: 403 });

  const rules = await db.rateLimitRule.findMany({
    select: { role: true, maxDocuments: true, maxDocumentSizeKB: true, allowedDocFormats: true },
  });

  const settings = await db.platformSetting.findMany({
    where: { key: { in: DOCUMENT_PLATFORM_KEYS } },
  });

  const settingsMap: Record<string, string> = {};
  for (const s of settings) settingsMap[s.key] = s.value;

  return jsonResponse({
    roleSettings: rules.map((r) => ({
      role: r.role,
      maxDocuments: r.maxDocuments,
      maxDocumentSizeKB: r.maxDocumentSizeKB,
      allowedDocFormats: parseJsonArray(r.allowedDocFormats),
    })),
    globalSettings: {
      enableDocumentFeature: settingsMap["documentFeatureEnabled"] !== "false",
      enableConversions: settingsMap["documentConversionsEnabled"] !== "false",
      defaultFormat: settingsMap["documentDefaultFormat"] || "html",
      autoSaveInterval: Number(settingsMap["documentAutoSaveInterval"] || "30"),
      maxVersions: Number(settingsMap["documentMaxVersions"] || "10"),
    },
  });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return jsonResponse({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { roleSettings, globalSettings } = body;

  if (Array.isArray(roleSettings)) {
    for (const rs of roleSettings) {
      if (!rs.role) continue;
      const updateData: Record<string, any> = {};
      if (rs.maxDocuments !== undefined) updateData.maxDocuments = Math.max(0, Math.min(99999, Number(rs.maxDocuments)));
      if (rs.maxDocumentSizeKB !== undefined) updateData.maxDocumentSizeKB = Math.max(0, Math.min(999999, Number(rs.maxDocumentSizeKB)));
      if (rs.allowedDocFormats !== undefined) updateData.allowedDocFormats = JSON.stringify(rs.allowedDocFormats);

      if (Object.keys(updateData).length > 0) {
        await db.rateLimitRule.upsert({
          where: { role: rs.role },
          update: updateData,
          create: { role: rs.role, ...updateData },
        });
      }
    }
  }

  if (globalSettings && typeof globalSettings === "object") {
    const entries: { key: string; value: string; label: string }[] = [];
    if (globalSettings.enableDocumentFeature !== undefined) entries.push({ key: "documentFeatureEnabled", value: String(globalSettings.enableDocumentFeature), label: "Document Feature Enabled" });
    if (globalSettings.enableConversions !== undefined) entries.push({ key: "documentConversionsEnabled", value: String(globalSettings.enableConversions), label: "Document Conversions Enabled" });
    if (globalSettings.defaultFormat !== undefined) entries.push({ key: "documentDefaultFormat", value: String(globalSettings.defaultFormat), label: "Default Document Format" });
    if (globalSettings.autoSaveInterval !== undefined) entries.push({ key: "documentAutoSaveInterval", value: String(globalSettings.autoSaveInterval), label: "Document Auto-Save Interval" });
    if (globalSettings.maxVersions !== undefined) entries.push({ key: "documentMaxVersions", value: String(globalSettings.maxVersions), label: "Document Max Versions" });

    for (const e of entries) {
      await db.platformSetting.upsert({
        where: { key: e.key },
        update: { value: e.value },
        create: { key: e.key, value: e.value, label: e.label, category: "documents", type: "string" },
      });
    }
  }

  await logAdminAction(admin.userId, "document-settings.updated", "document-settings", undefined, { roleSettings: body.roleSettings, globalSettings: body.globalSettings }, req.headers.get("x-forwarded-for") || undefined);

  return jsonResponse({ ok: true });
}

function parseJsonArray(str: string): string[] {
  try { return JSON.parse(str); } catch { return []; }
}
