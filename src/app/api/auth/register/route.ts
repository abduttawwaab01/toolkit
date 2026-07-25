import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const user = await createUser(email, password, name);
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
