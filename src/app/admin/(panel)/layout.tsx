import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserMenu } from "@/components/UserMenu";
import { AdminNav } from "@/components/AdminNav";
import logoder from "@/assets/img/logoder.jpg";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/admin/login");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F6F1E7" }}>
      <header
        className="border-b"
        style={{ backgroundColor: "#FED6D6" }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <Image src={logoder} alt="Logo" width={32} height={32} className="rounded-full object-cover" />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold">CuratedByDer</span>
              <span className="text-[11px] font-medium opacity-70">ADMIN PANEL</span>
            </div>
          </div>
          <div className="flex flex-1 justify-center">
            <AdminNav />
          </div>
          <div className="flex items-center gap-3">
            <UserMenu name={session?.user?.name ?? undefined} role={session?.user?.role} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  );
}