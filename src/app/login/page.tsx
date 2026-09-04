import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { HomeLogin } from "@/components/HomeLogin";
import { BookAccents } from "@/components/BookAccents";
import logo from "@/assets/img/logoderbaru.jpeg";

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={null}>
        <RedirectIfAuthed />
      </Suspense>
      <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-8 sm:py-12 lg:py-14"
      style={{ backgroundColor: "#FED6D6" }}
    >
      <BookAccents />

      <div className="relative flex flex-col items-center text-center max-w-2xl">
        <div className="mb-3 flex items-center gap-3">
          <Image
            src={logo}
            alt="CuratedByDer logo"
            className="h-20 w-20 rounded-full object-cover ring-2 ring-white/70 shadow"
            priority
          />
          <h1 className="text-4xl font-extrabold tracking-tight text-black sm:text-5xl">
            CuratedByDer
          </h1>
        </div>

        <p className="mb-8 max-w-xl text-lg text-muted-foreground">
          Welcome! Your Order Is on Its Way 📦
          <br />
          Keep track of your books from order placement to delivery.
        </p>
      </div>

      <HomeLogin />

      <div className="mt-5 sm:mt-8 w-full max-w-sm">
        <PhotoCarousel />
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