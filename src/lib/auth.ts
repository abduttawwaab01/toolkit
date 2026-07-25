import { db } from "./db";
import bcrypt from "bcryptjs";

export async function createUser(email: string, password: string, name?: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  return db.user.create({
    data: { email, passwordHash, name, role: "USER", creditsBalance: 5 },
  });
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}


