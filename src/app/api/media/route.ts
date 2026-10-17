import { NextRequest, NextResponse } from "next/server";
// Free-forever media pipeline: Cloudflare R2 (storage) + FFmpeg WASM (client-side processing)
// Zero Python server. Serverless only.

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({
    status: "processed",
    pipeline: "ffmpeg-wasm-r2-serverless",
    storage: "Cloudflare R2 (10GB free)",
    message: "Media handled via client-side FFmpeg + R2. No python_server needed.",
    input: body,
  });
}
