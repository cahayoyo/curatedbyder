"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SortButton({
  label,
  column,
  currentSort,
  currentDir,
  basePath,
  query,
  type = "az",
}: {
  label: string;
  column: string;
  currentSort?: string;
  currentDir?: string;
  basePath: string;
  query: Record<string, string | undefined>;
  type?: "az" | "num";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const active = currentSort === column;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (k === "sort" || k === "dir" || k === "page") return;
    if (v && v !== "") params.set(k, v);
  });

  if (active && currentDir === "asc") {
    params.set("sort", column);
    params.set("dir", "desc");
  } else if (active && currentDir === "desc") {
    // third click: clear sort, back to default
  } else {
    params.set("sort", column);
    params.set("dir", "asc");
  }

  const qs = params.toString();
  const href = qs ? `${basePath}?${qs}` : basePath;

  function handleClick() {
    if (isPending) return;
    startTransition(() => router.push(href));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1 transition-colors",
        active ? "text-black" : "text-muted-foreground hover:text-black",
        isPending && "cursor-wait opacity-70"
      )}
    >
      <span>{label}</span>
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : active ? (
        currentDir === "asc" ? (
          type === "num" ? (
            <ArrowUpNarrowWide className="h-3.5 w-3.5" />
          ) : (
            <ArrowUpAZ className="h-3.5 w-3.5" />
          )
        ) : type === "num" ? (
          <ArrowDownWideNarrow className="h-3.5 w-3.5" />
        ) : (
          <ArrowDownAZ className="h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5" />
      )}
    </button>
  );
}