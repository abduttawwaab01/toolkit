import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || user.creditsBalance <= 0) {
        return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
      }
    }

    const start = Date.now();

    const arrayBuffer = await imageFile.arrayBuffer();

    const { removeBackground } = await import("@imgly/background-removal");
    const resultBlob = await removeBackground(arrayBuffer);
    const resultArrayBuffer = await resultBlob.arrayBuffer();
    const resultBase64 = Buffer.from(resultArrayBuffer).toString("base64");

    const durationMs = Date.now() - start;

    if (userId) {
      await db.user.update({ where: { id: userId }, data: { creditsBalance: { decrement: 1 } } });
    }

    if (userId) {
      await db.aiUsageLog.create({
        data: {
          userId,
          feature: "remove-background",
          provider: "local",
          modelName: "imgly-background-removal",
          cost: 0,
          durationMs,
        },
      });
    }

    return NextResponse.json({
      data: {
        image: `data:image/png;base64,${resultBase64}`,
        format: "png",
      },
      usage: {
        provider: "local",
        cost: 0,
        durationMs,
        modelName: "imgly-background-removal",
      },
    });
  } catch (error: any) {
    console.error("Background removal error:", error);
    return NextResponse.json({ error: error.message || "Background removal failed" }, { status: 500 });
  }
}
