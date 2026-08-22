"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AtSign, BookOpen, ShoppingBag, UserRound } from "lucide-react";

const PLATFORMS = [
  { label: "Instagram", href: "https://www.instagram.com", icon: AtSign },
  { label: "Shopee", href: "https://shopee.com", icon: ShoppingBag },
];

const BOOK_ACCENTS = [
  { top: "10%", left: "8%", size: 44, rotate: "-15deg" },
  { top: "55%", left: "-6%", size: 56, rotate: "15deg" },
  { top: "8%", right: "6%", size: 50, rotate: "10deg" },
  { bottom: "5%", right: "12%", size: 40, rotate: "-10deg" },
];

export function HomeLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      redirect: false,
      mode: "buyer",
      username: String(form.get("username") || ""),
    });

    if (res?.error) {
      setFieldError(true);
      setLoading(false);
      return;
    }
    setFieldError(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <form
        onSubmit={onSubmit}
        className="relative space-y-3 overflow-hidden rounded-xl border bg-white/10 p-5 shadow-sm backdrop-blur-sm"
      >
        {BOOK_ACCENTS.map((a, i) => (
          <BookOpen
            key={i}
            className="pointer-events-none absolute z-0 text-black/10"
            style={{
              top: a.top,
              left: a.left,
              right: a.right,
              bottom: a.bottom,
              width: a.size,
              height: a.size,
              transform: `rotate(${a.rotate})`,
            }}
          />
        ))}
        <div className="relative z-10 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="login-username">Username</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-username"
                name="username"
                required
                autoComplete="username"
                placeholder="Contoh: prabowo2345"
                className={`pl-9 placeholder:text-[#b5b5b5] ${fieldError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                onChange={() => fieldError && setFieldError(false)}
                aria-invalid={fieldError}
              />
            </div>
            {fieldError && (
              <p className="text-xs font-medium text-red-600">Username tidak ditemukan!</p>
            )}
            <p className="text-xs text-black/60">
              Username = nama depan + 4 angka terakhir nomor HP. Contoh:{" "}
              <span className="font-semibold">prabowo subianto</span> + 08128312345 →{" "}
              <span className="font-semibold">prabowo2345</span>
            </p>
          </div>
        </div>

        <Button
          type="submit"
          variant="outline"
          className="w-full transition-all hover:bg-black hover:text-white"
          disabled={loading}
        >
          {loading ? "Memproses..." : "Masuk & Lihat Pesanan"}
        </Button>
      </form>

      <div className="grid grid-cols-2 gap-3">
        {PLATFORMS.map((p) => (
          <Button
            key={p.label}
            asChild
            variant="outline"
            className="w-full transition-all hover:bg-[#333] hover:text-white shadow-sm hover:shadow"
          >
            <a href={p.href} target="_blank" rel="noopener noreferrer">
              <p.icon className="h-4 w-4" />
              {p.label}
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}