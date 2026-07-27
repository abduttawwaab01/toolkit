import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const denoiseOnly = formData.get("denoiseOnly") === "true";

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || user.creditsBalance <= 0) {
        return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
      }
    }

    const start = Date.now();
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

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
