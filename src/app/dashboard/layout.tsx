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
    <div className="min-h-screen" style={{ backgroundColor: "#F6F1E7" }}>
      <AppHeader
        badge="USER DASHBOARD"
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
      <main className="mx-auto max-w-5xl p-4 pb-24 xl:pb-4">
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
  );
}
