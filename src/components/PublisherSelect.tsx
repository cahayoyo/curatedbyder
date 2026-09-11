"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL = "__all__";

export function PublisherSelect({
  basePath,
  options,
}: {
  basePath: string;
  options: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlValue = searchParams.get("publisher") ?? "";
  const value = urlValue && options.includes(urlValue) ? urlValue : ALL;
  const label = value === ALL ? "Semua Publisher" : value;

  function onChange(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v === ALL) params.delete("publisher");
    else params.set("publisher", v);
    params.delete("page");
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${basePath}?${qs}` : basePath));
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label="Filter publisher"
        disabled={isPending}
        className={cn(
          "h-9 w-full bg-white text-[15px] text-black sm:w-44",
          isPending && "opacity-70"
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>Semua Publisher</SelectItem>
        {options.map((p) => (
          <SelectItem key={p} value={p}>
            {p}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
