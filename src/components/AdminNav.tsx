"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, LayoutDashboard, BookOpen, ToyBrick, Users, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/books", label: "Buku", icon: BookOpen },
  { href: "/admin/toys", label: "Toys", icon: ToyBrick },
  { href: "/admin/buyers", label: "Pembeli", icon: Users },
  { href: "/admin/orders", label: "Pesanan", icon: ShoppingCart },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center">
      {/* Mobile: Menu dropdown */}
      <div className="md:hidden">
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              style={{ backgroundColor: "#D97A7A", color: "#ffffff" }}
              className="h-10 items-center gap-1.5 border border-input px-2 py-1 text-sm transition-colors hover:bg-[#c96666] hover:text-white"
            >
              <Menu className="h-4 w-4" />
              Menu
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" style={{ backgroundColor: "#FED6D6" }}>
            {links.map((l) => (
              <DropdownMenuItem
                key={l.href}
                asChild={false}
                onSelect={() => {
                  setOpen(false);
                  router.push(l.href);
                }}
                className={cn(
                  "cursor-pointer text-black/80 hover:bg-black/10 focus:bg-black/10 focus:text-black",
                  isActive(pathname, l.href) && "bg-[#D97A7A] font-semibold text-black"
                )}
              >
                <span className="flex w-full items-center gap-2">
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop: centered links */}
      <div className="hidden md:flex items-center gap-2">
        {links.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-black/70 transition-colors hover:bg-black/10 hover:text-black",
                active && "bg-[#D97A7A] font-semibold text-black shadow-sm"
              )}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}