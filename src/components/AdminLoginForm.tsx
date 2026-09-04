"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ExternalLink } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState<{ email?: boolean; password?: boolean }>({});

  function onFieldChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFieldError((f) => (f[e.target.name as "email" | "password"] ? { ...f, [e.target.name]: false } : f));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    const res = await signIn("credentials", {
      redirect: false,
      mode: "admin",
      email,
      password,
    });

    if (res?.error) {
      const err = res.error.toLowerCase();
      setFieldError({
        email: err.includes("email"),
        password: err.includes("sandi") || err.includes("password"),
      });
      setLoading(false);
      return;
    }
    setFieldError({});
    router.push("/admin");
    router.refresh();
  }

  return (
    <Card className="w-full rounded-2xl border-none bg-[#FDF1F1] shadow-lg shadow-rose-200/40">
      <CardContent className="px-6 pb-8 pt-8 sm:px-8">
        <div className="mb-6 flex flex-col items-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: "#F8D7D7" }}
          >
            <Lock className="h-6 w-6" style={{ color: "#C96A6A" }} />
          </div>
          <h1 className="mt-4 text-center font-serif text-3xl font-bold text-gray-900">
            Admin Login
          </h1>
          <p className="mt-1 text-center text-sm text-gray-500">
            Masuk untuk mengakses dashboard administrator.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-email" className="font-semibold text-gray-900">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="curatedbyderadmin@mail.com"
                className={`rounded-lg border-rose-200 bg-white pl-9 placeholder:text-[#c9c9c9] focus-visible:ring-[#E8B4B4] ${fieldError.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                onChange={onFieldChange}
                aria-invalid={fieldError.email}
              />
            </div>
            {fieldError.email && (
              <p className="text-xs font-medium text-red-600">Email salah!</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-password" className="font-semibold text-gray-900">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Masukkan password"
                className={`rounded-lg border-rose-200 bg-white pl-9 pr-10 placeholder:text-[#c9c9c9] focus-visible:ring-[#E8B4B4] ${fieldError.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                onChange={onFieldChange}
                aria-invalid={fieldError.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldError.password && (
              <p className="text-xs font-medium text-red-600">Password salah!</p>
            )}
          </div>
          <Button
            type="submit"
            className="h-11 w-full rounded-lg bg-[#D97A7A] text-white transition-colors hover:bg-[#C96A6A]"
            disabled={loading}
          >
            {loading ? (
              "Memproses..."
            ) : (
              <>
                Masuk
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-4">
          <Button
            asChild
            variant="outline"
            className="h-11 w-full rounded-lg border-gray-300 bg-white text-gray-900 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <Link href="/login">
              <ExternalLink className="h-4 w-4" />
              Kunjungi Website Dashboard User
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}