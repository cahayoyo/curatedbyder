"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutGrid, ShoppingCart, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/dashboard/catalog", label: "Katalog", icon: BookOpen },
  { href: "/dashboard/orders", label: "Pesanan", icon: ShoppingCart },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export function UserNav({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav
        aria-label="User navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[#F0CBCB] bg-white shadow-[0_-4px_12px_rgba(217,122,122,0.15)] xl:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-4 px-2 py-1">
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium text-[#C96A6A] transition-colors",
                  active && "bg-[#D97A7A] text-white shadow-sm"
                )}
              >
                <l.icon className="h-5 w-5" />
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <div className="flex items-center gap-7">
      {links.map((l) => {
        const active = isActive(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-base font-medium text-[#B04A4A] transition-colors hover:bg-black/5",
              active && "bg-[#D97A7A] font-semibold text-white shadow-sm hover:bg-[#D97A7A]"
            )}
          >
            <l.icon className="h-5 w-5" />
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}
