import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { cloneVoice, listVoices, deleteVoice } from "@/lib/elevenlabs";
import { downloadFromR2 } from "@/lib/r2";
import { isBodyTooLarge } from "@/lib/r2-file-helper";

export async function GET() {
  try {
    const voices = await listVoices();
    return NextResponse.json({ voices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to list voices" }, { status: 500 });
  }
}

async function resolveAudioFiles(req: NextRequest): Promise<{ name: string; description?: string; audioFiles: File[] }> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = await req.json();
    const { name, description, r2Keys } = body;
    if (!name) throw Object.assign(new Error("Voice name is required"), { status: 400 });
    if (!r2Keys || !Array.isArray(r2Keys) || r2Keys.length === 0) {
      throw Object.assign(new Error("At least one audio sample is required"), { status: 400 });
    }
    if (r2Keys.length > 10) throw Object.assign(new Error("Maximum 10 audio samples allowed"), { status: 400 });
    const buffers = await Promise.all(r2Keys.map((k: string) => downloadFromR2(k)));
    const audioFiles: File[] = buffers.map((buf, i) => {
      const name = r2Keys[i].split("/").pop() || `sample-${i}.wav`;
      return new File([new Uint8Array(buf)], name, { type: "audio/wav" });
    });
    return { name, description, audioFiles };
  }
  const formData = await req.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const audioFiles: File[] = [];
  for (const [key, value] of formData.entries()) {
    if (value instanceof File && key === "files") {
      audioFiles.push(value);
    }
  }
  if (!name) throw Object.assign(new Error("Voice name is required"), { status: 400 });
  if (audioFiles.length === 0) throw Object.assign(new Error("At least one audio sample is required"), { status: 400 });
  if (audioFiles.length > 10) throw Object.assign(new Error("Maximum 10 audio samples allowed"), { status: 400 });
  return { name, description: description || undefined, audioFiles };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    if (isBodyTooLarge(req)) {
      return NextResponse.json({
        error: "Files too large. Upload to R2 first via /api/media/presign, then POST with { r2Keys }.",
      }, { status: 413 });
    }

    const { name, description, audioFiles } = await resolveAudioFiles(req);

    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || user.creditsBalance <= 0) {
        return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
      }
    }

    const start = Date.now();

    const result = await cloneVoice({
      name,
      description,
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
