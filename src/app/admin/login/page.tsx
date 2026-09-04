import { AdminLoginForm } from "@/components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4"
      style={{ backgroundColor: "#F9DEDE" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-48 h-[30rem] w-[30rem] rounded-full"
        style={{ backgroundColor: "#F6CFCF" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-56 -left-40 h-[34rem] w-[34rem] rounded-full"
        style={{ backgroundColor: "#F6CFCF" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-[10%] h-40 w-40 rounded-full opacity-80"
        style={{ backgroundColor: "#F6CFCF" }}
      />

      <header className="relative z-10 mb-6 text-center">
        <p className="font-serif text-4xl font-bold text-gray-900">
          CuratedBy<span style={{ color: "#C96A6A" }}>Der</span>
        </p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.35em] text-gray-500">
          Books · Stories · To You
        </p>
      </header>

      <main className="relative z-10 w-full max-w-sm sm:max-w-md">
        <AdminLoginForm />
      </main>

      <footer className="relative z-10 mt-6 text-center text-[11px] text-gray-400">
        © 2026 CuratedByDer. All rights reserved.
      </footer>
    </div>
  );
}
