import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { BookxcessCalculator } from "@/components/BookxcessCalculator";
import { HomeLogin } from "@/components/HomeLogin";
import logo from "@/assets/img/logoderbaru.jpeg";

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={null}>
        <RedirectIfAuthed />
      </Suspense>
      <main
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-8 sm:py-12 lg:py-14"
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

        <div className="relative flex max-w-2xl flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-3">
            <Image
              src={logo}
              alt="CuratedByDer logo"
              className="h-20 w-20 rounded-full object-cover ring-2 ring-white/70 shadow"
              priority
            />
            <h1 className="font-serif text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              CuratedBy<span style={{ color: "#C96A6A" }}>Der</span>
            </h1>
          </div>

          <p className="mb-1 max-w-xl text-base font-bold text-gray-900 sm:text-2xl">
            Welcome! Your Order Is on Its Way 📦
          </p>
          <p className="mb-3 max-w-xl text-sm text-gray-600 sm:text-base">
            Keep track of your books from order placement to delivery.
          </p>
        </div>

        <div className="relative z-10">
          <HomeLogin />
        </div>

        <div className="relative z-10 mt-4 w-full max-w-sm sm:mt-5 sm:max-w-md">
          <BookxcessCalculator />
        </div>
      </main>
    </>
  );
}

export async function RedirectIfAuthed() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");
  return null;
}
