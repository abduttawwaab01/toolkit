import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSignedDownloadUrl, getPublicUrl } from "@/lib/r2";

/** GET /api/media — list user's media files */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || req.headers.get("x-user-id");
  const type = req.nextUrl.searchParams.get("type"); // optional filter: video, audio, image
  const search = req.nextUrl.searchParams.get("search");

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const where: any = { userId, deletedAt: null };
  if (type) where.mimeType = { startsWith: type === "video" ? "video" : type === "audio" ? "audio" : "image" };

  const files = await db.projectFile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const items = await Promise.all(
    files.map(async (f) => ({
      id: f.id,
      name: f.originalName,
      type: detectMediaType(f.mimeType),
      mimeType: f.mimeType,
      size: Number(f.size),
      duration: f.duration,
      width: f.width,
      height: f.height,
      url: getPublicUrl(f.storagePath),
      thumbnailUrl: null,
      createdAt: f.createdAt.toISOString(),
      autoDeleteAt: f.autoDeleteAt?.toISOString() ?? null,
    })),
  );

  // Client-side search filter
  const filtered = search
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  return NextResponse.json({ items: filtered, total: filtered.length });
}

function detectMediaType(mimeType: string): "video" | "audio" | "image" {
  if (mimeType.startsWith("video")) return "video";
  if (mimeType.startsWith("audio")) return "audio";
  if (mimeType.startsWith("image")) return "image";
  return "video";
}
