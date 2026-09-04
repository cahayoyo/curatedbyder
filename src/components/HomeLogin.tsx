"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Camera, Phone, ShoppingBag, UserRound } from "lucide-react";

const PLATFORMS = [
  { label: "Instagram", href: "https://www.instagram.com/curatedbyder/", icon: Camera },
  { label: "Shopee", href: "https://shopee.co.id/projectbyder", icon: ShoppingBag },
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
      const err = res.error;
      setFieldError({
        username: err.includes("USERNAME_NOT_FOUND"),
        phone: err.includes("PHONE_MISMATCH"),
      });
      setLoading(false);
      return;
    }
    setFieldError({});
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <form
        onSubmit={onSubmit}
        className="relative space-y-3 overflow-hidden rounded-2xl border-none bg-[#FDF1F1] p-5 shadow-lg shadow-rose-200/40 sm:p-6"
      >
        <div className="relative z-10 space-y-2">
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
                className={`rounded-lg border-rose-200 bg-white pl-9 placeholder:text-[#c9c9c9] focus-visible:ring-[#E8B4B4] ${fieldError.username ? "border-destructive focus-visible:ring-destructive" : ""}`}
                onChange={onFieldChange}
                aria-invalid={fieldError.username}
              />
            </div>
            {fieldError.username && (
              <p className="text-xs font-medium text-red-600">Username tidak ditemukan!</p>
            )}
            <p className="text-xs text-gray-500">
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
                className={`rounded-lg border-rose-200 bg-white pl-9 pr-10 placeholder:text-[#c9c9c9] focus-visible:ring-[#E8B4B4] ${fieldError.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
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
          className="h-11 w-full rounded-lg border-rose-200 bg-[#D97A7A] text-white transition-colors hover:bg-[#C96A6A] hover:text-white"
          disabled={loading}
        >
          {loading ? (
            "Memproses..."
          ) : (
            <>
              Masuk &amp; Lihat Pesanan
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-gray-600">
          Jika ada kendala,{" "}
          <a
            href="https://wa.me/6281284605363?text=Halo%20Admin%20CuratedByDer%2C%0A%0ASaya%20lupa%20username%20untuk%20masuk%20ke%20Website%20CuratedByDer%0AMohon%20bantuannya%2C%20Terimakasih"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#C96A6A] transition-colors hover:text-[#B85C5C] hover:underline"
          >
            Hubungi Admin
          </a>
        </p>
      </form>

      <div className="grid grid-cols-2 gap-3">
        {PLATFORMS.map((p) => (
          <Button
            key={p.label}
            asChild
            variant="outline"
            className="w-full border-[#D9A3A3] bg-[#FDF1F1] text-[#C96A6A] shadow-sm transition-colors hover:bg-[#F8D7D7] hover:text-[#C96A6A] hover:shadow"
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