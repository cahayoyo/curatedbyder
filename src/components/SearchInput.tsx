"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchInput({
  basePath,
  placeholder,
  placeholderClassName = "",
  paramKey = "q",
}: {
  basePath: string;
  placeholder: string;
  placeholderClassName?: string;
  paramKey?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramKey) ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(searchParams.get(paramKey) ?? "");
  }, [searchParams, paramKey]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (v) params.set(paramKey, v);
      else params.delete(paramKey);
      params.delete("page");
      router.replace(`${basePath}?${params.toString()}`);
    }, 350);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`pl-10 placeholder:text-xs placeholder:text-black/30 ${placeholderClassName}`}
      />
    </div>
  );
}