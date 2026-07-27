import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { enqueueJob } from "@/lib/job-queue";

const MAX_SYNC_SIZE = 100 * 1024 * 1024; // 100MB — process sync; job queue is wired for future use

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const mode = (formData.get("mode") as string) || "4";

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    if (!["2", "4"].includes(mode)) {
      return NextResponse.json({ error: "Invalid mode; use '2' or '4'" }, { status: 400 });
    }

    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || user.creditsBalance <= 0) {
        return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
      }
    }

    const start = Date.now();
    const arrayBuffer = await audioFile.arrayBuffer();
    const initialBuffer = Buffer.from(arrayBuffer);
    let audioBuffer: Buffer = initialBuffer;

    // Convert non-WAV to WAV via FFmpeg WASM (client-side wrapper on server)
    const isWav = audioBuffer.length > 4 && audioBuffer.toString("ascii", 0, 4) === "RIFF";
    if (!isWav) {
      try {
        const { convertToWav } = await import("@/lib/audio-engine/convert-to-wav");
        audioBuffer = Buffer.from(await convertToWav(audioBuffer, audioFile.type));
      } catch {
        return NextResponse.json({
          error: "Could not convert audio to WAV. Please upload a WAV file or install ffmpeg on the server.",
        }, { status: 400 });
      }
    }

    // Enqueue large files for background processing
    if (audioBuffer.length > MAX_SYNC_SIZE) {
      const job = await enqueueJob("ai-process", {
        type: "stem-separation",
        audioData: audioBuffer.toString("base64"),
        mode,
        userId,
        mimeType: "audio/wav",
      }, { priority: 1, maxRetries: 2 });
      return NextResponse.json({
        jobId: job.id,
        message: "Large file queued for background processing",
      });
    }

    const { separateWithDemucs } = await import("@/lib/audio-engine/demucs-server");
    const stemsResult = await separateWithDemucs(audioBuffer, undefined, mode as "2" | "4");

    const output: Record<string, string> = {
      vocals: `data:audio/wav;base64,${stemsResult.vocals.toString("base64")}`,
      drums: `data:audio/wav;base64,${stemsResult.drums.toString("base64")}`,
      bass: `data:audio/wav;base64,${stemsResult.bass.toString("base64")}`,
      other: `data:audio/wav;base64,${stemsResult.other.toString("base64")}`,
    };

    if (stemsResult.accompaniment && mode === "2") {
      output.accompaniment = `data:audio/wav;base64,${stemsResult.accompaniment.toString("base64")}`;
    }

    const filtered: Record<string, string> = {};
    if (mode === "2") {
      if (output.vocals) filtered.vocals = output.vocals;
      if (output.accompaniment) filtered.accompaniment = output.accompaniment;
    } else {
      Object.assign(filtered, output);
    }

    const durationMs = Date.now() - start;

    if (userId) {
      await db.aiUsageLog.create({
        data: {
          userId,
          feature: "stem-separation",
          provider: "demucs-local",
          modelName: "htdemucs",
          cost: 0,
          durationMs,
        },
      });
    }

    return NextResponse.json({
      data: {
        stems: filtered,
        mode,
        stemCount: Object.keys(filtered).length,
      },
      usage: {
        provider: "demucs-local",
        cost: 0,
        durationMs,
        modelName: "htdemucs",
      },
    });
  } catch (error: any) {
    console.error("Audio separation error:", error);
    return NextResponse.json({ error: error.message || "Audio separation failed" }, { status: 500 });
  }
}
