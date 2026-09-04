import { Suspense } from "react";
import { UserMenu } from "@/components/UserMenu";
import { AdminNav } from "@/components/AdminNav";
import { NavMenuFallback } from "@/components/NavMenuFallback";
import { AppHeader } from "@/components/AppHeader";
import { HeaderMenus, RoleGate } from "@/components/session-gate";
import { ListLoader } from "@/components/ListLoader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F6F1E7" }}>
      <AppHeader
        badge="ADMIN DASHBOARD"
        mobileNav={
          <Suspense fallback={<NavMenuFallback />}>
            <AdminNav />
          </Suspense>
        }
        desktopNav={
          <Suspense fallback={null}>
            <AdminNav />
          </Suspense>
        }
        menus={
          <Suspense fallback={<UserMenu name={undefined} role={undefined} />}>
            <HeaderMenus role="SUPER_ADMIN" />
          </Suspense>
        }
      />
      <main className="p-4">
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
  );
}
