import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { localTTS, localListTTSVoices } from "@/lib/ai/local-adapter";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    const body = await req.json();
    const { text, voiceId, voice, speed } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json({ error: "Text must be under 5000 characters" }, { status: 400 });
    }

    const start = Date.now();

    // Try local Edge TTS first (free)
    const localResult = await localTTS({
      text,
      voice: voiceId || voice || "en-US-AriaNeural",
      rate: speed ? `${speed > 1 ? "+" : ""}${Math.round((speed - 1) * 100)}%` : "+0%",
    });

    if (localResult) {
      const durationMs = Date.now() - start;
      const base64 = localResult.audioBuffer.toString("base64");

      // No credit cost for local TTS
      await db.aiUsageLog.create({
        data: {
          userId,
          feature: "tts",
          provider: "edge-tts-local",
          cost: 0,
          durationMs,
        },
      });

      return NextResponse.json({
        data: {
          audio: `data:${localResult.contentType};base64,${base64}`,
          characterCount: text.length,
        },
        usage: {
          provider: "edge-tts-local",
          cost: 0,
          durationMs,
        },
      });
    }

    // Fallback to ElevenLabs if local server is unavailable
    try {
      const { textToSpeech } = await import("@/lib/elevenlabs");
      if (!voiceId) {
        return NextResponse.json({ error: "Local TTS server unavailable. Provide a voiceId for ElevenLabs fallback." }, { status: 503 });
      }

      if (userId) {
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user || user.creditsBalance <= 0) {
          return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
        }
      }

      const result = await textToSpeech({
        text,
        voiceId,
        stability: body.stability,
        similarityBoost: body.similarityBoost,
        style: body.style,
        speed: body.speed,
      });

      const durationMs = Date.now() - start;

      if (userId) {
        await db.user.update({ where: { id: userId }, data: { creditsBalance: { decrement: 1 } } });
      }

      await db.aiUsageLog.create({
        data: { userId, feature: "tts", provider: "elevenlabs", cost: 0.01, durationMs },
      });

      return NextResponse.json({
        data: {
          audio: `data:${result.contentType};base64,${result.audioBase64}`,
          characterCount: result.characterCount,
        },
        usage: { provider: "elevenlabs", cost: 0.01, durationMs },
      });
    } catch {
      return NextResponse.json({
        error: "Local TTS server unavailable. Start the local AI server (python server.py) or set ELEVENLABS_API_KEY.",
      }, { status: 503 });
    }
  } catch (error: any) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: error.message || "TTS failed" }, { status: 500 });
  }
}

export async function GET() {
  // Try local voices first
  const localVoices = await localListTTSVoices();
  if (localVoices) {
    return NextResponse.json({ voices: localVoices });
  }

  // Fallback to ElevenLabs
  try {
    const { listVoices } = await import("@/lib/elevenlabs");
    const voices = await listVoices();
    return NextResponse.json({ voices });
  } catch {
    return NextResponse.json({ voices: [] });
  }
}
