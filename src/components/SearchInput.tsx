"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

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
  const urlQ = searchParams.get(paramKey) ?? "";
  const [value, setValue] = useState(urlQ);
  const [lastUrlQ, setLastUrlQ] = useState(urlQ);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (lastUrlQ !== urlQ) {
    setLastUrlQ(urlQ);
    setValue(urlQ);
  }

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

  function clear() {
    setValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramKey);
    params.delete("page");
    router.replace(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`pl-10 pr-9 placeholder:text-xs placeholder:text-black/30 ${placeholderClassName}`}
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}