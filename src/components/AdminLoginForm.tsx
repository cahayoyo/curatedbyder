"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

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
    <Card className="w-full max-w-sm" style={{ backgroundColor: "#F6F1E7" }}>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="login-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="curatedbyderadmin@mail.com"
                className={`pl-9 placeholder:text-[#b5b5b5] ${fieldError.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                onChange={onFieldChange}
                aria-invalid={fieldError.email}
              />
            </div>
            {fieldError.email && (
              <p className="text-xs font-medium text-red-600">Email salah!</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="******"
                className={`pl-9 pr-10 placeholder:text-[#b5b5b5] ${fieldError.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
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
            variant="outline"
            className="w-full transition-all "
            style={{ backgroundColor: "#D97A7A", color: "#ffffff" }}
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <div className="mt-4">
          <Link href="/" className="block">
            <Button
              type="button"
              variant="outline"
              className="w-full border border-black bg-transparent text-black transition-colors hover:bg-black hover:text-white"
            >
              Kunjungi Website Dashboard User
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}