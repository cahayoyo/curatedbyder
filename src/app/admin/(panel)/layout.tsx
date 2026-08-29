import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserMenu } from "@/components/UserMenu";
import { AdminNav } from "@/components/AdminNav";
import logoder from "@/assets/img/logoderbaru.jpeg";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === "USER") redirect("/dashboard");
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/admin/login");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F6F1E7" }}>
      <header
        className="border-b"
        style={{ backgroundColor: "#FED6D6" }}
      >
        <div className="mx-auto grid h-14 max-w-5xl grid-cols-[auto_1fr_auto] items-center gap-2 px-4 md:flex">
          <div className="flex md:hidden">
            <AdminNav />
          </div>

          <div className="flex min-w-0 items-center justify-self-center gap-2 md:mr-2 md:justify-self-start">
            <Image src={logoder} alt="Logo" width={32} height={32} className="shrink-0 rounded-full object-cover" />
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-semibold">CuratedByDer</span>
              <span className="truncate text-[11px] font-medium opacity-70">ADMIN DASHBOARD</span>
            </div>
          </div>

          <div className="hidden md:flex md:flex-1 md:justify-center">
            <AdminNav />
          </div>

          <div className="flex justify-self-end md:hidden">
            <UserMenu name={session?.user?.name ?? undefined} role={session?.user?.role} />
          </div>
          <div className="hidden md:flex md:justify-self-end">
            <UserMenu name={session?.user?.name ?? undefined} role={session?.user?.role} />
          </div>
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}