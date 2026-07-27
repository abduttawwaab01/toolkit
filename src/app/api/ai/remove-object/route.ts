import { NextRequest, NextResponse } from "next/server";
import { runReplicateModelByName, downloadFile } from "@/lib/replicate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { localRemoveObject } from "@/lib/ai/local-adapter";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const maskFile = formData.get("mask") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }
    if (!maskFile) {
      return NextResponse.json({ error: "No mask file provided" }, { status: 400 });
    }

    const start = Date.now();
    const [imageBuffer, maskBuffer] = await Promise.all([
      imageFile.arrayBuffer(),
      maskFile.arrayBuffer(),
    ]);

    // Try local LaMa first (free)
    const localResult = await localRemoveObject(
      Buffer.from(imageBuffer),
      Buffer.from(maskBuffer),
    );

    if (localResult) {
      const durationMs = Date.now() - start;
      const base64 = localResult.imageBuffer.toString("base64");

      await db.aiUsageLog.create({
        data: { userId, feature: "remove-object", provider: "lama-local", cost: 0, durationMs },
      });

      return NextResponse.json({
        data: { image: `data:image/png;base64,${base64}`, format: "png" },
        usage: { provider: "lama-local", cost: 0, durationMs },
      });
    }

    // Fallback to Replicate
    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || user.creditsBalance <= 0) {
        return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
      }
    }

    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const base64Mask = Buffer.from(maskBuffer).toString("base64");
    const imageDataUri = `data:${imageFile.type || "image/png"};base64,${base64Image}`;
    const maskDataUri = `data:${maskFile.type || "image/png"};base64,${base64Mask}`;

    const output = await runReplicateModelByName(
      "arielgold/lama",
      { image: imageDataUri, mask: maskDataUri },
      180_000,
    );

    let resultImageUrl: string;
    if (output?.image) resultImageUrl = output.image;
    else if (Array.isArray(output) && output.length > 0) resultImageUrl = output[0];
    else if (typeof output === "string") resultImageUrl = output;
    else throw new Error("Unexpected model output format");

    const resultBuffer = await downloadFile(resultImageUrl);
    const resultBase64 = resultBuffer.toString("base64");
    const durationMs = Date.now() - start;

    if (userId) {
      await db.user.update({ where: { id: userId }, data: { creditsBalance: { decrement: 2 } } });
    }

    await db.aiUsageLog.create({
      data: { userId, feature: "remove-object", provider: "replicate", modelName: "arielgold/lama", cost: 0.004, durationMs },
    });

    return NextResponse.json({
      data: { image: `data:image/png;base64,${resultBase64}`, format: "png" },
      usage: { provider: "replicate", cost: 0.004, durationMs, modelName: "arielgold/lama" },
    });
  } catch (error: any) {
    console.error("Object removal error:", error);
    return NextResponse.json({ error: error.message || "Object removal failed" }, { status: 500 });
  }
}
