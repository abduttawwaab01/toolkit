import { NextResponse } from "next/server";
import { createGuestUser } from "@/lib/auth";
import jwt from "jsonwebtoken";

export async function POST() {
  const user = await createGuestUser();
  const token = jwt.sign({ id: user.id, role: "GUEST" }, process.env.AUTH_SECRET!, { expiresIn: "1d" });
  return NextResponse.json({ token, user: { id: user.id, role: user.role } });
}
