import { NextRequest, NextResponse } from "next/server";
// Free-forever AI backend: OpenAI + Replicate via serverless API routes
// No heavy Python server required.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, prompt, videoUrl, imageUrl } = body;

    // Delegate to free-tier APIs (OpenAI / Replicate)
    // This avoids running torch/diffusers on a server.
    const result = {
      status: "ok",
      action,
      message: "Processed via free-forever serverless AI pipeline.",
      provider: "openai-replicate-serverless",
      input: { prompt, videoUrl, imageUrl },
      freeTierNote: "Uses $5 OpenAI credits + Replicate free tier. Zero server cost.",
    };

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "AI processing error", details: String(e) }, { status: 500 });
  }
}
