import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Heart, Package, Truck } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { HomeLogin } from "@/components/HomeLogin";
import logo from "@/assets/img/logoderbaru.jpeg";

const FEATURES = [
  { icon: Package, title: "Original Products", sub: "Curated with love" },
  { icon: Truck, title: "Safe Delivery", sub: "From our shelf to yours" },
  { icon: Heart, title: "A Happier You", sub: "One book at a time" },
];

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

          <p className="mb-2 max-w-xl text-sm font-bold text-gray-900 sm:text-xl">
            Welcome! Your Order Is on Its Way 📦
          </p>
          <p className="mb-8 max-w-xl text-sm text-gray-600 sm:text-base">
            Keep track of your books from order placement to delivery.
          </p>
        </div>

        <div className="relative z-10">
          <HomeLogin />
        </div>

        <div className="relative z-10 mt-3 w-full max-w-sm sm:mt-4 sm:max-w-md">
          <PhotoCarousel />
        </div>

        <div className="relative z-10 mt-8 grid w-full max-w-sm grid-cols-3 gap-2 sm:max-w-2xl sm:gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-center justify-center gap-2 text-left sm:gap-3">
              <f.icon className="h-5 w-5 shrink-0 text-gray-700 sm:h-6 sm:w-6" />
              <div>
                <p className="text-xs font-semibold text-gray-900 sm:text-sm">{f.title}</p>
                <p className="text-[10px] text-gray-600 sm:text-xs">{f.sub}</p>
              </div>
            </div>
          ))}
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
