import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(role: "SUPER_ADMIN" | "USER") {
  const session = await requireSession();
  if (session.user.role !== role) {
    if (role === "SUPER_ADMIN") redirect("/admin/login");
    redirect("/login");
  }
  return session;
}
