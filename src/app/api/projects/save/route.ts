import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";

function sanitizeMetadata(data: any): any {
  if (data === null || data === undefined) return {};
  if (typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(sanitizeMetadata);

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (typeof value === "number" && (!Number.isFinite(value))) continue;
    if (typeof value === "object" && value !== null) {
      clean[key] = sanitizeMetadata(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, data } = body;

    if (!id) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const metadata = sanitizeMetadata(data || {});

    const metadataStr = JSON.stringify(metadata);
    if (metadataStr.length > 5_000_000) {
      return NextResponse.json({ error: "Project data too large" }, { status: 413 });
    }

    const project = await db.project.upsert({
      where: { id },
      update: {
        name: name || "Untitled Project",
        metadata,
      },
      create: {
        id,
        userId,
        name: name || "Untitled Project",
        metadata,
      },
    });

    return NextResponse.json({ success: true, projectId: project.id });
  } catch (error: any) {
    console.error("Project save error:", error?.message, error?.code);
    return NextResponse.json({ error: "Failed to save project" }, { status: 500 });
  }
}
