import { AdminLoginForm } from "@/components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4"
      style={{ backgroundColor: "#FBE4E4" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-40 h-96 w-96 rounded-full opacity-70"
        style={{ backgroundColor: "#F8D3D3" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -left-36 h-[28rem] w-[28rem] rounded-full opacity-60"
        style={{ backgroundColor: "#F8D3D3" }}
      />

      <header className="relative z-10 mb-6 text-center">
        <p className="font-serif text-4xl font-bold text-gray-900">
          CuratedBy<span style={{ color: "#C96A6A" }}>Der</span>
        </p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.35em] text-gray-500">
          Books · Stories · To You
        </p>
      </header>

      <main className="relative z-10 w-full max-w-sm">
        <AdminLoginForm />
      </main>

      <footer className="relative z-10 mt-6 text-center text-xs text-gray-500">
        © 2026 CuratedByDer. All rights reserved.
      </footer>
    </div>
  );
}
