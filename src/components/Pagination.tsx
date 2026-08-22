import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  total,
  page,
  pageSize,
  basePath,
  query,
}: {
  total: number;
  page: number;
  pageSize: number;
  basePath: string;
  query: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);

  function href(p: number) {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const pages: (number | "…")[] = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(totalPages, current + 2);
  for (let i = start; i <= end; i++) pages.push(i);
  if (start > 2) pages.unshift("…");
  if (start > 1) pages.unshift(1);
  if (end < totalPages - 1) pages.push("…");
  if (end < totalPages) pages.push(totalPages);

  if (totalPages <= 1) return null;

  const btn =
    "inline-flex h-9 items-center justify-center gap-1 rounded-md border border-input px-3 text-sm font-medium transition-colors hover:bg-[#FED6D6] hover:text-black";

  return (
    <div className="flex items-center justify-center gap-2">
      <Link
        href={href(current - 1)}
        className={cn(btn, current <= 1 && "pointer-events-none opacity-50")}
        aria-disabled={current <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`e${idx}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={cn(
              btn,
              p === current && "bg-[#FED6D6] text-black hover:bg-[#FED6D6]"
            )}
          >
            {p}
          </Link>
        )
      )}
      <Link
        href={href(current + 1)}
        className={cn(btn, current >= totalPages && "pointer-events-none opacity-50")}
        aria-disabled={current >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
