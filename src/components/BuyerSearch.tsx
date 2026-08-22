"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function BuyerSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v);
    const params = new URLSearchParams(searchParams.toString());
    if (v) params.set("q", v);
    else params.delete("q");
    params.delete("page");
    router.replace(`/admin/buyers?${params.toString()}`);
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={onChange}
        placeholder="Cari username / nama / nomor telepon..."
        className="pl-10 placeholder:text-black/30"
      />
    </div>
  );
}
