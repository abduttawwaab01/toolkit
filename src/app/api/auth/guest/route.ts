import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  let user = await db.user.findFirst({
    where: { role: "GUEST", adminNotes: `ip:${ip}` },
  });

  if (!user) {
    user = await db.user.create({
      data: { role: "GUEST", creditsBalance: 3, storageLimit: BigInt(104857600), adminNotes: `ip:${ip}` },
    });
  }

  const token = jwt.sign({ id: user.id, role: "GUEST", ip }, process.env.AUTH_SECRET!, { expiresIn: "1d" });
  return NextResponse.json({ token, user: { id: user.id, role: user.role } });
}
