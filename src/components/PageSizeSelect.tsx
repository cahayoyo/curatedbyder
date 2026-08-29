"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZES, DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export function PageSizeSelect({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = Number(searchParams.get("per"));

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("per", value);
    params.delete("page");
    router.replace(`${basePath}?${params.toString()}`);
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
        className="h-9 w-20 shrink-0"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PAGE_SIZES.map((s) => (
          <SelectItem key={s} value={String(s)}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
