import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { cloneVoice, listVoices, deleteVoice } from "@/lib/elevenlabs";

export async function GET() {
  try {
    const voices = await listVoices();
    return NextResponse.json({ voices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to list voices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const audioFiles: File[] = [];

    for (const [key, value] of formData.entries()) {
      if (value instanceof File && key === "files") {
        audioFiles.push(value);
      }
    }

    if (!name) {
      return NextResponse.json({ error: "Voice name is required" }, { status: 400 });
    }

    if (audioFiles.length === 0) {
      return NextResponse.json({ error: "At least one audio sample is required" }, { status: 400 });
    }

    if (audioFiles.length > 10) {
      return NextResponse.json({ error: "Maximum 10 audio samples allowed" }, { status: 400 });
    }

    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || user.creditsBalance <= 0) {
        return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
      }
    }

    const start = Date.now();

    const result = await cloneVoice({
      name,
      description: description || undefined,
      audioFiles,
    });

    const durationMs = Date.now() - start;

    if (userId) {
      await db.user.update({ where: { id: userId }, data: { creditsBalance: { decrement: 5 } } });
    }

    await db.aiUsageLog.create({
      data: {
        userId,
        feature: "voice-clone",
        provider: "elevenlabs",
        cost: 0.05,
        durationMs,
      },
    });

    return NextResponse.json({
      data: result,
      usage: {
        provider: "elevenlabs",
        cost: 0.05,
        durationMs,
      },
    });
  } catch (error: any) {
    console.error("Voice cloning error:", error);
    return NextResponse.json({ error: error.message || "Voice cloning failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const voiceId = searchParams.get("voiceId");
    if (!voiceId) {
      return NextResponse.json({ error: "Voice ID is required" }, { status: 400 });
    }

    await deleteVoice(voiceId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete voice" }, { status: 500 });
  }
}
