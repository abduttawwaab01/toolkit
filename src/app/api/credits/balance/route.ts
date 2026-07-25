import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { jsonResponse } from "@/lib/json";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { creditsBalance: true, role: true },
  });

  if (!user) {
    return jsonResponse({ error: "User not found" }, 404);
  }

  return jsonResponse({
    credits: user.creditsBalance,
    role: user.role,
  });
}
