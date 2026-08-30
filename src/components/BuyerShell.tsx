"use client";

import { createContext, useCallback, useContext, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export const BuyerNavContext = createContext<{
  pending: boolean;
  source: string;
  navigate: (url: string, source: string) => void;
}>({ pending: false, source: "", navigate: () => {} });

export function useBuyerNav(source: string) {
  const ctx = useContext(BuyerNavContext);
  return {
    pending: ctx.pending,
    active: ctx.pending && ctx.source === source,
    navigate: (url: string) => ctx.navigate(url, source),
  };
}

export function BuyerShell({ children }: { children: ReactNode }) {
  const [pending, startTransition] = useTransition();
  const [source, setSource] = useState("");
  const router = useRouter();
  const navigate = useCallback(
    (url: string, src: string) => {
      setSource(src);
      startTransition(() => router.push(url));
    },
    [router]
  );
  return <BuyerNavContext.Provider value={{ pending, source, navigate }}>{children}</BuyerNavContext.Provider>;
}

export function PendingDim({ children }: { children: ReactNode }) {
  const { pending } = useContext(BuyerNavContext);
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-150", pending && "pointer-events-none opacity-50")}>
      {children}
    </div>
  );
}
