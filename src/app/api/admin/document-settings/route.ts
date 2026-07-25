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

const DOC_PER_ROLE_KEYS = ["maxDocuments", "maxDocumentSizeKB", "allowedDocFormats"];

function roleDocKey(role: string, field: string) {
  return `doc_limit_${role}_${field}`;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return jsonResponse({ error: "Forbidden" }, { status: 403 });

  const roleSettings = await Promise.all(
    ["GUEST", "USER", "ADMIN"].map(async (role) => {
      const getInt = async (field: string, fallback: number) => {
        try {
          const s = await db.platformSetting.findUnique({ where: { key: roleDocKey(role, field) } });
          return s ? parseInt(s.value, 10) || fallback : fallback;
        } catch { return fallback; }
      };
      const getStr = async (field: string, fallback: string) => {
        try {
          const s = await db.platformSetting.findUnique({ where: { key: roleDocKey(role, field) } });
          return s ? s.value : fallback;
        } catch { return fallback; }
      };
      return {
        role,
        maxDocuments: await getInt("maxDocuments", role === "GUEST" ? 5 : role === "ADMIN" ? 99999 : 50),
        maxDocumentSizeKB: await getInt("maxDocumentSizeKB", role === "GUEST" ? 1024 : role === "ADMIN" ? 102400 : 5120),
        allowedDocFormats: parseJsonArray(await getStr("allowedDocFormats", '["txt","md","html","pdf","docx","rtf"]')),
      };
    })
  );

  const settings = await db.platformSetting.findMany({
    where: { key: { in: DOCUMENT_PLATFORM_KEYS } },
  });

  const settingsMap: Record<string, string> = {};
  for (const s of settings) settingsMap[s.key] = s.value;

  return jsonResponse({
    roleSettings,
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
      const labels: Record<string, string> = {
        maxDocuments: "Max Documents",
        maxDocumentSizeKB: "Max Document Size (KB)",
        allowedDocFormats: "Allowed Document Formats",
      };
      if (rs.maxDocuments !== undefined) {
        const key = roleDocKey(rs.role, "maxDocuments");
        await db.platformSetting.upsert({
          where: { key },
          update: { value: String(Math.max(0, Math.min(99999, Number(rs.maxDocuments)))) },
          create: { key, value: String(Math.max(0, Math.min(99999, Number(rs.maxDocuments)))), label: `${rs.role} - ${labels.maxDocuments}`, category: "documents", type: "number" },
        });
      }
      if (rs.maxDocumentSizeKB !== undefined) {
        const key = roleDocKey(rs.role, "maxDocumentSizeKB");
        await db.platformSetting.upsert({
          where: { key },
          update: { value: String(Math.max(0, Math.min(999999, Number(rs.maxDocumentSizeKB)))) },
          create: { key, value: String(Math.max(0, Math.min(999999, Number(rs.maxDocumentSizeKB)))), label: `${rs.role} - ${labels.maxDocumentSizeKB}`, category: "documents", type: "number" },
        });
      }
      if (rs.allowedDocFormats !== undefined) {
        const key = roleDocKey(rs.role, "allowedDocFormats");
        const val = JSON.stringify(rs.allowedDocFormats);
        await db.platformSetting.upsert({
          where: { key },
          update: { value: val },
          create: { key, value: val, label: `${rs.role} - ${labels.allowedDocFormats}`, category: "documents", type: "string" },
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
