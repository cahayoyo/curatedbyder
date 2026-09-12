import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

// Mirrors the RoleGate redirects so page-level guards behave like the layouts.
export async function requireRole(role: "SUPER_ADMIN" | "USER") {
  const session = await getServerSession(authOptions);
  const current = session?.user?.role as "SUPER_ADMIN" | "USER" | undefined;
  if (session && current === role) return session;

  if (role === "SUPER_ADMIN") {
    redirect(current === "USER" ? "/dashboard" : "/admin/login");
  }
  redirect("/login");
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