import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserMenu } from "@/components/UserMenu";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { name?: string; role?: string } | undefined;
  if (user?.role === "SUPER_ADMIN") redirect("/admin");
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/dashboard" className="font-semibold">
            CuratedByDer
          </Link>
          <div className="flex items-center gap-3">
            <UserMenu name={user?.name} role={user?.role} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  );
}