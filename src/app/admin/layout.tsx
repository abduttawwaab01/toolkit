import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || role !== "ADMIN") {
    redirect("/auth/login");
  }
  return <>{children}</>;
}
