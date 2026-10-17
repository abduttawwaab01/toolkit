import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { resolveFile, isBodyTooLarge } from "@/lib/r2-file-helper";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    if (isBodyTooLarge(req)) {
      return NextResponse.json({
        error: "File too large. Upload to R2 first via /api/media/presign, then POST with { r2Key }.",
      }, { status: 413 });
    }

    const { file: fileResult, fields } = await resolveFile(req, "audio");
    if (!fileResult) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const denoiseOnly = fields.denoiseOnly === "true";

    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || user.creditsBalance <= 0) {
        return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
      }
    }

    const start = Date.now();
    const audioBuffer = fileResult.buffer;

    const { denoiseWithDeepFilterNet } = await import("@/lib/audio-engine/denoise-server");
    const result = await denoiseWithDeepFilterNet(audioBuffer);

    const resultBase64 = result.audioBuffer.toString("base64");
    const durationMs = Date.now() - start;

    if (userId) {
      await db.user.update({ where: { id: userId }, data: { creditsBalance: { decrement: 1 } } });
    }

    if (userId) {
      await db.aiUsageLog.create({
        data: {
          userId,
          feature: "audio-denoise",
          provider: "local",
          modelName: "deepfilternet3",
          cost: 0,
          durationMs,
        },
      });
    }

    return NextResponse.json({
      data: {
        audio: `data:audio/wav;base64,${resultBase64}`,
        mode: denoiseOnly ? "denoise" : "enhance",
      },
      usage: {
        provider: "local",
        cost: 0,
        durationMs,
        modelName: "deepfilternet3",
      },
    });
  } catch (error: any) {
    console.error("Audio denoise error:", error);
    return NextResponse.json({ error: error.message || "Audio denoising failed" }, { status: 500 });
  }
}
