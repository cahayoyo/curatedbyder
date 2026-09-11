"use client";

import { useEffect, useTransition } from "react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRound, LogOut, ChevronDown, Settings } from "lucide-react";
import Link from "next/link";
import { customSignOut } from "@/server/actions/auth";

let identifiedUserId: string | undefined;

export function UserMenu({
  id,
  name,
  email,
  role,
}: {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}) {
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!id || identifiedUserId === id) return;

    posthog.identify(id, { name, email, role });
    identifiedUserId = id;
  }, [email, id, name, role]);
  const isAdmin = role === "SUPER_ADMIN";
  const signOutUrl = isAdmin ? "/admin" : "/";

  const handleSignOut = () => {
    startTransition(async () => {
      await customSignOut();
      posthog.reset();
      identifiedUserId = undefined;
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
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D97A7A]">
            <UserRound className="h-6 w-6 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
          </span>
          <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
            <span className="max-w-32 truncate text-base font-bold text-black/80">{name || "Account"}</span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#C96A6A]">
              {isAdmin ? "ADMIN" : role || "USER"}
            </span>
          </span>
          <ChevronDown className="hidden h-5 w-5 text-black/70 sm:block" strokeWidth={2.5} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-[#F0CBCB] bg-white">
        <DropdownMenuLabel className="text-[#B85C5C]">{name || "Account"}</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#F6D5D5]" />
        {isAdmin && (
          <DropdownMenuItem
            asChild
            className="cursor-pointer font-semibold text-[#B85C5C] transition-colors hover:bg-[#FBE6E6] hover:text-[#B85C5C] focus:bg-[#FBE6E6] focus:text-[#B85C5C]"
          >
            <Link href="/admin/settings">
              <Settings className="h-4 w-4" />
              Pengaturan
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={handleSignOut}
          disabled={isPending}
          className="cursor-pointer font-semibold text-[#B85C5C] transition-colors hover:bg-[#FBE6E6] hover:text-[#B85C5C] focus:bg-[#FBE6E6] focus:text-[#B85C5C]"
        >
          <LogOut className="h-4 w-4" />
          {isPending ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}