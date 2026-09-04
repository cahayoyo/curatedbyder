import { Suspense } from "react";
import { UserMenu } from "@/components/UserMenu";
import { UserNav } from "@/components/UserNav";
import { NavMenuFallback } from "@/components/NavMenuFallback";
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
        mobileNav={
          <Suspense fallback={<NavMenuFallback />}>
            <UserNav />
          </Suspense>
        }
        desktopNav={
          <Suspense fallback={null}>
            <UserNav />
          </Suspense>
        }
        menus={
          <Suspense fallback={<UserMenu name={undefined} role={undefined} />}>
            <HeaderMenus role="USER" />
          </Suspense>
        }
      />
      <main className="mx-auto max-w-5xl p-4">
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
