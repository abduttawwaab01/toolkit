import { NextRequest, NextResponse } from "next/server";
import { runReplicateModelByName, downloadFile } from "@/lib/replicate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { localImageGenerate } from "@/lib/ai/local-adapter";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    const body = await req.json();
    const { prompt, negativePrompt, width, height, guidanceScale, steps, seed, model } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const start = Date.now();

    // Try local SDXL first (free)
    const localResult = await localImageGenerate({
      prompt,
      negativePrompt: negativePrompt || "blurry, low quality, distorted, deformed",
      width: width || 512,
      height: height || 512,
      steps: steps || 4,
      guidanceScale,
      seed,
    });

    if (localResult) {
      const durationMs = Date.now() - start;
      const base64 = localResult.imageBuffer.toString("base64");

      await db.aiUsageLog.create({
        data: { userId, feature: "generate-image", provider: "sdxl-local", cost: 0, durationMs },
      });

      return NextResponse.json({
        data: {
          image: `data:image/png;base64,${base64}`,
          prompt,
          model: "local-sdxl",
          width: width || 512,
          height: height || 512,
        },
        usage: { provider: "sdxl-local", cost: 0, durationMs },
      });
    }

    // Fallback to Replicate
    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || user.creditsBalance <= 0) {
        return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
      }
    }

    const selectedModel = model || "bytedance/sdxl-lightning-4step";
    const output = await runReplicateModelByName(
      selectedModel,
      {
        prompt,
        negative_prompt: negativePrompt || "blurry, low quality, distorted, deformed",
        width: width || 1024,
        height: height || 1024,
        guidance_scale: guidanceScale || 7.5,
        num_inference_steps: steps || 4,
        ...(seed ? { seed } : {}),
      },
      120_000,
    );

    let resultImageUrl: string;
    if (Array.isArray(output) && output.length > 0) resultImageUrl = output[0];
    else if (output?.image) resultImageUrl = output.image;
    else if (typeof output === "string") resultImageUrl = output;
    else throw new Error("Unexpected model output format");

    const resultBuffer = await downloadFile(resultImageUrl);
    const resultBase64 = resultBuffer.toString("base64");
    const durationMs = Date.now() - start;

    if (userId) {
      await db.user.update({ where: { id: userId }, data: { creditsBalance: { decrement: 3 } } });
    }

    await db.aiUsageLog.create({
      data: { userId, feature: "generate-image", provider: "replicate", modelName: selectedModel, cost: 0.01, durationMs },
    });

    return NextResponse.json({
      data: { image: `data:image/png;base64,${resultBase64}`, prompt, model: selectedModel, width: width || 1024, height: height || 1024 },
      usage: { provider: "replicate", cost: 0.01, durationMs, modelName: selectedModel },
    });
  } catch (error: any) {
    console.error("Image generation error:", error);
    return NextResponse.json({ error: error.message || "Image generation failed" }, { status: 500 });
  }
}
