"use client";

import { createContext, useCallback, useContext, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export const BuyerNavContext = createContext<{
  pending: boolean;
  navigate: (url: string) => void;
}>({ pending: false, navigate: () => {} });

export function useBuyerNav() {
  return useContext(BuyerNavContext);
}

export function BuyerShell({ children }: { children: ReactNode }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const navigate = useCallback(
    (url: string) => {
      startTransition(() => router.push(url));
    },
    [router]
  );
  return <BuyerNavContext.Provider value={{ pending, navigate }}>{children}</BuyerNavContext.Provider>;
}

export function PendingDim({ children }: { children: ReactNode }) {
  const { pending } = useBuyerNav();
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-150", pending && "pointer-events-none opacity-50")}>
      {children}
    </div>
  );
}
