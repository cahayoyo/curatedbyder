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
    <div className="min-h-screen" style={{ backgroundColor: "#F6F1E7" }}>
      <AppHeader
        badge="ADMIN DASHBOARD"
        className="bg-white"
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
      <main className="p-4 pb-24 md:pb-4">
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
