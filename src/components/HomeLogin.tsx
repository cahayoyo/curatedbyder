"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AtSign, BookOpen, Phone, ShoppingBag, UserRound } from "lucide-react";

const PLATFORMS = [
  { label: "Instagram", href: "https://www.instagram.com/curatedbyder/", icon: AtSign },
  { label: "Shopee", href: "https://shopee.co.id/projectbyder", icon: ShoppingBag },
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
  const [fieldError, setFieldError] = useState<{ username?: boolean; phone?: boolean }>({});

  function onFieldChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.name as "username" | "phone";
    setFieldError((f) => (f[name] ? { ...f, [name]: false } : f));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      redirect: false,
      mode: "buyer",
      username: String(form.get("username") || ""),
      phone: String(form.get("phone") || ""),
    });

    if (res?.error) {
      const err = res.error.toLowerCase();
      setFieldError({
        username: err.includes("username") || err.includes("tidak"),
        phone: err.includes("nomor") || err.includes("telepon") || err.includes("cocok"),
      });
      setLoading(false);
      return;
    }
    setFieldError({});
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
                placeholder="Contoh: curatedbyder123"
                className={`pl-9 placeholder:text-[#b5b5b5] ${fieldError.username ? "border-destructive focus-visible:ring-destructive" : ""}`}
                onChange={onFieldChange}
                aria-invalid={fieldError.username}
              />
            </div>
            {fieldError.username && (
              <p className="text-xs font-medium text-red-600">Username tidak ditemukan!</p>
            )}
            <p className="text-xs text-black/60">
              Masukkan username yang sudah pernah diberikan oleh admin
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-phone">Nomor Telepon</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="Contoh: 08128312345"
                className={`pl-9 placeholder:text-[#b5b5b5] ${fieldError.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                onChange={onFieldChange}
                aria-invalid={fieldError.phone}
              />
            </div>
            {fieldError.phone && (
              <p className="text-xs font-medium text-red-600">Nomor telepon tidak cocok!</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          variant="outline"
          className="w-full transition-colors hover:bg-[#c96666]! hover:text-white!"
          style={{ backgroundColor: "#D97A7A", color: "#ffffff" }}
          disabled={loading}
        >
          {loading ? "Memproses..." : "Masuk & Lihat Pesanan"}
        </Button>

        <p className="text-center text-xs font-medium text-black/70">
          Hubungi Admin
        </p>
      </form>

      <div className="grid grid-cols-2 gap-3">
        {PLATFORMS.map((p) => (
          <Button
            key={p.label}
            asChild
            variant="outline"
            className="w-full shadow-sm transition-colors hover:bg-[#c96666]! hover:text-white! hover:shadow"
            style={{ backgroundColor: "#D97A7A", color: "#ffffff" }}
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