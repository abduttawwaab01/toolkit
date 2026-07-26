import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
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
