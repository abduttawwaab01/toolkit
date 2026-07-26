import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const mode = (formData.get("mode") as string) || "vocals";

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    return NextResponse.json({
      data: {
        note: "Server-side AI separation not yet available. Use client-side processing.",
        fileName: audioFile.name,
        fileSize: audioFile.size,
        mode,
      },
      usage: {
        provider: "client-side",
        cost: 0,
        durationMs: 0,
        modelName: "web-audio-api",
      },
    });
  } catch (error: any) {
    console.error("Audio separation error:", error);
    return NextResponse.json({ error: error.message || "Audio separation failed" }, { status: 500 });
  }
}
