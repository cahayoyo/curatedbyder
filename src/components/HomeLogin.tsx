"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { capture } from "@/lib/posthog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Camera, Phone, ShoppingBag, UserRound } from "lucide-react";

const PLATFORMS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/curatedbyder/",
    icon: Camera,
    btn: "border-purple-300 bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-600",
  },
  {
    label: "Shopee",
    href: "https://shopee.co.id/projectbyder",
    icon: ShoppingBag,
    btn: "border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-600",
  },
];

export function HomeLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function onFieldChange() {
    setFormError(null);
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
      setFormError("Username atau nomor telepon salah. Coba lagi.");
      setLoading(false);
      return;
    }
    setFormError(null);
    capture("buyer_login_succeeded", { login_mode: "buyer" });
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
                placeholder="Contoh: namamu1234"
                className="rounded-lg border-rose-200 bg-white pl-9 placeholder:text-[#c9c9c9] focus-visible:ring-[#E8B4B4]"
                onChange={onFieldChange}
              />
            </div>
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
                className="rounded-lg border-rose-200 bg-white pl-9 pr-10 placeholder:text-[#c9c9c9] focus-visible:ring-[#E8B4B4]"
                onChange={onFieldChange}
              />
            </div>
          </div>
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-600"
          >
            {formError}
          </p>
        )}

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
            className={`w-full border bg-white shadow-sm transition-colors hover:shadow ${p.btn}`}
          >
            <a
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => capture("social_link_clicked", { platform: p.label.toLowerCase() })}
            >
              <p.icon className="h-4 w-4" />
              {p.label}
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}