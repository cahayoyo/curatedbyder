"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRound, LogOut, ChevronDown } from "lucide-react";
import { customSignOut } from "@/server/actions/auth";

export function UserMenu({ name, role }: { name?: string; role?: string }) {
  const [isPending, startTransition] = useTransition();
  const isAdmin = role === "SUPER_ADMIN";
  const signOutUrl = isAdmin ? "/admin" : "/";

  const handleSignOut = () => {
    startTransition(async () => {
      await customSignOut();
      window.location.href = signOutUrl;
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label="Account menu"
          className="flex h-auto items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-black/5"
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D97A7A]">
            <UserRound className="h-5 w-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
          </span>
          <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
            <span className="max-w-28 truncate text-sm font-semibold text-black/80">{name || "Account"}</span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#C96A6A]">
              {isAdmin ? "ADMIN" : role || "USER"}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-black/60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" style={{ backgroundColor: "#FED6D6" }}>
        <DropdownMenuLabel className="text-black/80">{name || "Account"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleSignOut}
          disabled={isPending}
          className="cursor-pointer bg-[#FED6D6] font-semibold text-black transition-colors hover:bg-[#D97A7A] hover:text-white focus:bg-[#D97A7A] focus:text-white"
        >
          <LogOut className="h-4 w-4" />
          {isPending ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}