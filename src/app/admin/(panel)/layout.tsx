import { Suspense } from "react";
import { UserMenu } from "@/components/UserMenu";
import { AdminNav } from "@/components/AdminNav";
import { AppHeader } from "@/components/AppHeader";
import { HeaderMenus, RoleGate } from "@/components/session-gate";
import { ListLoader } from "@/components/ListLoader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen flex-col md:px-14"
      style={{ background: "linear-gradient(180deg, #F2CACA 0%, #E9B5B5 50%, #F2CACA 100%)" }}
    >
      <div className="flex flex-1 flex-col overflow-hidden rounded-none bg-[#F6F1E7] md:rounded-b-xl">
        <AppHeader
          badge="ADMIN DASHBOARD"
          wide
          className="bg-gradient-to-r from-[#FBE6E6] to-[#F6D5D5] border-[#F0CBCB]"
          desktopNav={
            <Suspense fallback={null}>
              <AdminNav variant="desktop" />
            </Suspense>
          }
          menus={
            <Suspense fallback={<UserMenu name={undefined} role={undefined} />}>
              <HeaderMenus role="SUPER_ADMIN" />
            </Suspense>
          }
        />
        <Suspense fallback={null}>
          <AdminNav variant="mobile" />
        </Suspense>
        <main className="flex-1 p-4 pb-24 md:pb-4">
          <Suspense
            fallback={
              <div className="space-y-4">
                <ListLoader label="Memuat halaman..." />
              </div>
            }
          >
            <RoleGate role="SUPER_ADMIN">{children}</RoleGate>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
