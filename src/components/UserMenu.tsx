"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRound, LogOut } from "lucide-react";

export function UserMenu({ name, role }: { name?: string; role?: string }) {
  const isAdmin = role === "SUPER_ADMIN";
  const signOutUrl = isAdmin ? "/admin" : "/";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          aria-label="Account menu"
          style={{ backgroundColor: "#D97A7A", color: "#ffffff" }}
          className="relative h-10 items-center gap-2 border border-input px-2 py-1 transition-colors hover:bg-[#c96666] hover:text-white"
        >
          <UserRound className="h-5 w-5" />
          <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-background" />
          <span className="flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold">{name || "Account"}</span>
            <span className="text-[11px] font-medium opacity-70">{isAdmin ? "ADMIN" : role || "USER"}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" style={{ backgroundColor: "#FED6D6" }}>
        <DropdownMenuLabel className="text-black/80">{name || "Account"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => signOut({ callbackUrl: signOutUrl })}
          className="cursor-pointer bg-[#FED6D6] font-semibold text-black transition-colors hover:bg-[#D97A7A] hover:text-white focus:bg-[#D97A7A] focus:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}