import { Suspense } from "react";
import { UserMenu } from "@/components/UserMenu";
import { UserNav } from "@/components/UserNav";
import { AppHeader } from "@/components/AppHeader";
import { HeaderMenus, RoleGate } from "@/components/session-gate";
import { ListLoader } from "@/components/ListLoader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen flex-col md:px-14"
      style={{ background: "linear-gradient(180deg, #F2CACA 0%, #E9B5B5 50%, #F2CACA 100%)" }}
    >
      <div className="flex flex-1 flex-col overflow-hidden rounded-none bg-[#FDF1F1] md:rounded-b-xl">
        <AppHeader
          badge="USER DASHBOARD"
          wide
          className="bg-gradient-to-r from-[#FBE6E6] to-[#F6D5D5] border-[#F0CBCB] md:rounded-b-xl md:border"
          desktopNav={
            <Suspense fallback={null}>
              <UserNav variant="desktop" />
            </Suspense>
          }
          menus={
            <Suspense fallback={<UserMenu name={undefined} role={undefined} />}>
              <HeaderMenus role="USER" />
            </Suspense>
          }
        />
        <Suspense fallback={null}>
          <UserNav variant="mobile" />
        </Suspense>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 pb-24 xl:pb-4">
          <Suspense
            fallback={
              <div className="space-y-4">
                <ListLoader label="Memuat halaman..." />
              </div>
            }
          >
            <RoleGate role="USER">{children}</RoleGate>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
