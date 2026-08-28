import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

async function requireSession() {
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

type SessionLike = {
  user?: {
    id?: string;
    role?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
} | null;

function isAdmin(session: SessionLike): boolean {
  return session?.user?.role === "SUPER_ADMIN";
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) throw new Error("Forbidden");
  return session;
}