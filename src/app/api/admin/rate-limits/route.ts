import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rules = await db.rateLimitRule.findMany();
  return jsonResponse(rules);
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { role, requestsPerMinute, requestsPerHour, concurrentJobs, maxFileSize, maxStoragePerUser, maxProjects, maxDurationMinutes, maxResolution, exportQuality, exportWatermark, aiCreditsPerDay, allowedMimeTypes } = body;

  if (!role || typeof role !== "string") {
    return jsonResponse({ error: "role is required" }, { status: 400 });
  }

  const updateData: Record<string, any> = {};
  if (requestsPerMinute !== undefined) updateData.requestsPerMinute = Math.max(0, Math.min(100000, Number(requestsPerMinute)));
  if (requestsPerHour !== undefined) updateData.requestsPerHour = Math.max(0, Math.min(10000000, Number(requestsPerHour)));
  if (concurrentJobs !== undefined) updateData.concurrentJobs = Math.max(0, Math.min(10000, Number(concurrentJobs)));
  if (maxFileSize !== undefined) updateData.maxFileSize = BigInt(Math.max(0, Number(maxFileSize)));
  if (maxStoragePerUser !== undefined) updateData.maxStoragePerUser = BigInt(Math.max(0, Number(maxStoragePerUser)));
  if (maxProjects !== undefined) updateData.maxProjects = Math.max(0, Math.min(99999, Number(maxProjects)));
  if (maxDurationMinutes !== undefined) updateData.maxDurationMinutes = Math.max(0, Math.min(999999, Number(maxDurationMinutes)));
  if (maxResolution !== undefined) updateData.maxResolution = String(maxResolution);
  if (exportQuality !== undefined) updateData.exportQuality = String(exportQuality);
  if (exportWatermark !== undefined) updateData.exportWatermark = Boolean(exportWatermark);
  if (aiCreditsPerDay !== undefined) updateData.aiCreditsPerDay = Math.max(0, Math.min(100000, Number(aiCreditsPerDay)));
  if (allowedMimeTypes !== undefined) updateData.allowedMimeTypes = allowedMimeTypes ? String(allowedMimeTypes) : null;

  const rule = await db.rateLimitRule.upsert({
    where: { role },
    update: updateData,
    create: { role, ...updateData },
  });

  await logAdminAction(admin.userId, "rate-limit.updated", "rate-limit", rule.id, { role, ...updateData }, req.headers.get("x-forwarded-for") || undefined);

  return jsonResponse(rule);
}
