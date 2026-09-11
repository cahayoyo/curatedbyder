"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL = "__all__";

export function ParamSelect({
  basePath,
  param,
  placeholder,
  options,
  icon,
  iconOnly = false,
  triggerClassName,
}: {
  basePath: string;
  param: string;
  placeholder: string;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
  iconOnly?: boolean;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlValue = searchParams.get(param) ?? "";
  const value = urlValue && options.some((o) => o.value === urlValue) ? urlValue : ALL;
  const label =
    value === ALL ? placeholder : options.find((o) => o.value === value)?.label ?? placeholder;

  function onChange(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v === ALL) params.delete(param);
    else params.set(param, v);
    params.delete("page");
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${basePath}?${qs}` : basePath));
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={iconOnly ? placeholder : undefined}
        disabled={isPending}
        className={cn(
          "h-10 w-full bg-white text-[15px] text-black",
          iconOnly && "w-10 shrink-0 justify-center px-0 [&>svg]:hidden",
          isPending && "opacity-70",
          triggerClassName
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {icon ? (
            <span className={cn("shrink-0", iconOnly ? "text-black" : "text-muted-foreground")}>
              {icon}
            </span>
          ) : null}
          <span className={cn("truncate", iconOnly && "sr-only")}>{label}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
