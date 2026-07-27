import { NextRequest, NextResponse } from "next/server";
import { runReplicateModelByName, downloadFile } from "@/lib/replicate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { localUpscaleVideo } from "@/lib/ai/local-adapter";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    const formData = await req.formData();
    const videoFile = formData.get("video") as File | null;
    const scale = (formData.get("scale") as string) || "4";

    if (!videoFile) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const start = Date.now();
    const arrayBuffer = await videoFile.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);

    // Try local Real-ESRGAN first (free)
    const localResult = await localUpscaleVideo(videoBuffer, parseInt(scale) || 4);

    if (localResult) {
      const durationMs = Date.now() - start;
      const base64 = localResult.videoBuffer.toString("base64");

      await db.aiUsageLog.create({
        data: { userId, feature: "upscale-video", provider: "esrgan-local", cost: 0, durationMs },
      });

      return NextResponse.json({
        data: { video: `data:video/mp4;base64,${base64}`, scale: parseInt(scale) || 4 },
        usage: { provider: "esrgan-local", cost: 0, durationMs },
      });
    }

    // Fallback to Replicate
    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || user.creditsBalance <= 0) {
        return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
      }
    }

    const base64Video = videoBuffer.toString("base64");
    const dataUri = `data:${videoFile.type || "video/mp4"};base64,${base64Video}`;

    const output = await runReplicateModelByName(
      "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
      { image: dataUri, scale: parseInt(scale) || 4, face_enhance: true },
      600_000,
    );

    let resultUrl: string;
    if (output?.image) resultUrl = output.image;
    else if (Array.isArray(output) && output.length > 0) resultUrl = output[0];
    else if (typeof output === "string") resultUrl = output;
    else throw new Error("Unexpected model output format");

    const resultBuffer = await downloadFile(resultUrl);
    const resultBase64 = resultBuffer.toString("base64");
    const durationMs = Date.now() - start;

    if (userId) {
      await db.user.update({ where: { id: userId }, data: { creditsBalance: { decrement: 5 } } });
    }

    await db.aiUsageLog.create({
      data: { userId, feature: "upscale-video", provider: "replicate", modelName: "nightmareai/real-esrgan", cost: 0.02, durationMs },
    });

    return NextResponse.json({
      data: { video: `data:video/mp4;base64,${resultBase64}`, scale: parseInt(scale) || 4 },
      usage: { provider: "replicate", cost: 0.02, durationMs, modelName: "nightmareai/real-esrgan" },
    });
  } catch (error: any) {
    console.error("Video upscaling error:", error);
    return NextResponse.json({ error: error.message || "Video upscaling failed" }, { status: 500 });
  }
}
