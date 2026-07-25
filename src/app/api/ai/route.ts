import { NextRequest, NextResponse } from "next/server";
import { aiRouter } from "@/lib/ai-router";
import { db } from "@/lib/db";
import { checkAiCredits, incrementAiUsage } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { feature, userId } = body;

    if (!feature) return NextResponse.json({ error: "Feature is required" }, { status: 400 });

    if (userId) {
      const credits = await checkAiCredits(userId);
      if (!credits.hasCredits) {
        return NextResponse.json({ error: "Daily AI credit limit reached. Upgrade your plan." }, { status: 429 });
      }
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || user.creditsBalance <= 0) {
        return NextResponse.json({ error: "Insufficient AI credits" }, { status: 402 });
      }
    }

    let result: any;

    switch (feature) {
      case "transcribe": {
        const audioBuffer = Buffer.from(body.audio, "base64");
        result = await aiRouter.transcribe(audioBuffer, { language: body.language });
        break;
      }
      case "text-to-speech": {
        result = await aiRouter.textToSpeech(body.text, { voice: body.voice });
        break;
      }
      case "remove-background": {
        const imageBuffer = Buffer.from(body.image, "base64");
        result = await aiRouter.removeBackground(imageBuffer);
        break;
      }
      case "chat": {
        result = await aiRouter.chat(body.messages || [], {
          temperature: body.temperature,
          maxTokens: body.maxTokens,
        });
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown feature: ${feature}` }, { status: 400 });
    }

    if (userId) {
      await db.user.update({ where: { id: userId }, data: { creditsBalance: { decrement: 1 } } });
      await incrementAiUsage(userId);
    }

    await db.aiUsageLog.create({
      data: {
        userId,
        feature,
        provider: result.usage.provider,
        modelName: result.usage.modelName,
        tokensUsed: result.usage.tokensUsed,
        cost: result.usage.cost,
        durationMs: result.usage.durationMs,
      },
    });

    return NextResponse.json({ data: result.data, usage: result.usage });
  } catch (error: any) {
    console.error("AI error:", error);
    return NextResponse.json({ error: error.message || "AI processing failed" }, { status: 500 });
  }
}
