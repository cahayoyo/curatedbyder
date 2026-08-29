"use client";

import { useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAGE_SIZES, DEFAULT_PAGE_SIZE } from "@/lib/pagination";

// Module scope: survives soft navigations, resets on real page load/reload.
// Used so a ?per= bookmark/reload falls back to the default size once.
let didHandleInitialPer = false;

export function PageSizeSelect({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const current = Number(searchParams.get("per"));

  useEffect(() => {
    if (didHandleInitialPer) return;
    didHandleInitialPer = true;
    if (searchParams.get("per")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("per");
      const qs = params.toString();
      router.replace(qs ? `${basePath}?${qs}` : basePath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("per", value);
    params.delete("page");
    startTransition(() => router.replace(`${basePath}?${params.toString()}`));
  }

  return (
    <Select
      value={
        (PAGE_SIZES as readonly number[]).includes(current)
          ? String(current)
          : String(DEFAULT_PAGE_SIZE)
      }
      onValueChange={onChange}
    >
      <SelectTrigger
        aria-label="Jumlah item per halaman"
        title="Item per halaman"
        disabled={isPending}
        className={cn(
          "h-9 w-20 shrink-0 bg-white",
          isPending && "cursor-wait opacity-70"
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#D97A7A]" />
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      <SelectContent className="bg-white">
        {PAGE_SIZES.map((s) => (
          <SelectItem key={s} value={String(s)}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
