"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, BookOpen, Package, Users, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/books", label: "Buku", icon: BookOpen },
  { href: "/admin/toys", label: "Mainan", icon: Package },
  { href: "/admin/buyers", label: "Pembeli", icon: Users },
  { href: "/admin/orders", label: "Pesanan", icon: ShoppingCart },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminNav({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav
        aria-label="Admin navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-white md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5 px-2 py-1">
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
    <div className="flex items-center gap-2">
      {links.map((l) => {
        const active = isActive(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium text-[#B04A4A] transition-colors hover:bg-black/5",
              active && "bg-[#D97A7A] font-semibold text-white shadow-sm hover:bg-[#D97A7A]"
            )}
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}
