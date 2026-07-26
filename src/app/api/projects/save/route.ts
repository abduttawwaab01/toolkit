import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id") || req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const body = await req.json();
    const { id, name, data } = body;

    if (!id) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const project = await db.project.upsert({
      where: { id },
      update: {
        name: name || "Untitled Project",
        metadata: data || {},
      },
      create: {
        id,
        userId,
        name: name || "Untitled Project",
        metadata: data || {},
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("Project save error:", error);
    return NextResponse.json({ error: "Failed to save project" }, { status: 500 });
  }
}
