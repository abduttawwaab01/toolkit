import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { localMusicGenerate } from "@/lib/ai/local-adapter";
import { runReplicateModelByName, downloadFile } from "@/lib/replicate";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    const body = await req.json();
    const { prompt, duration, temperature, topP, classifierFreeGuidance, outputFormat } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const start = Date.now();

    // Try local MusicGen first (free)
    const localResult = await localMusicGenerate({
      prompt,
      duration: duration || 8,
      temperature,
      topP,
      classifierFreeGuidance,
    });

    if (localResult) {
      const durationMs = Date.now() - start;
      const base64 = localResult.audioBuffer.toString("base64");

      await db.aiUsageLog.create({
        data: { userId, feature: "music-generate", provider: "musicgen-local", cost: 0, durationMs },
      });

      return NextResponse.json({
        data: {
          audio: `data:audio/wav;base64,${base64}`,
          prompt,
          duration: duration || 8,
        },
        usage: { provider: "musicgen-local", cost: 0, durationMs },
      });
    }

    // Fallback to Replicate
    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || user.creditsBalance <= 0) {
        return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
      }
    }

    const output = await runReplicateModelByName(
      "meta/musicgen:62f43833e51983e7803f056d455078e3e68323231a885123941fcf3e3a433588",
      {
        prompt,
        duration: duration || 8,
        temperature: temperature ?? 1.0,
        top_p: topP ?? 0.9,
        classifier_free_guidance: classifierFreeGuidance ?? 3.0,
        output_format: outputFormat || "mp3",
      },
      180_000,
    );

    let audioUrl: string;
    if (Array.isArray(output) && output.length > 0) audioUrl = output[0];
    else if (typeof output === "string") audioUrl = output;
    else if (output?.audio) audioUrl = output.audio;
    else throw new Error("Unexpected model output format");

    const audioBuffer = await downloadFile(audioUrl);
    const audioBase64 = audioBuffer.toString("base64");
    const durationMs = Date.now() - start;

    if (userId) {
      await db.user.update({ where: { id: userId }, data: { creditsBalance: { decrement: 4 } } });
    }

    await db.aiUsageLog.create({
      data: { userId, feature: "music-generate", provider: "replicate", modelName: "meta/musicgen", cost: 0.04, durationMs },
    });

    return NextResponse.json({
      data: {
        audio: `data:audio/${outputFormat || "mp3"};base64,${audioBase64}`,
        prompt,
        duration: duration || 8,
      },
      usage: { provider: "replicate", cost: 0.04, durationMs, modelName: "meta/musicgen" },
    });
  } catch (error: any) {
    console.error("Music generation error:", error);
    return NextResponse.json({ error: error.message || "Music generation failed" }, { status: 500 });
  }
}
