import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { jsonResponse } from "@/lib/json";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { creditsBalance: true, role: true },
  });

  if (!user) {
    return jsonResponse({ error: "User not found" }, { status: 404 });
  }

  return jsonResponse({
    credits: user.creditsBalance,
    role: user.role,
  });
}
