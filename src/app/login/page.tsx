import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { HomeLogin } from "@/components/HomeLogin";
import { BookAccents } from "@/components/BookAccents";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-8 sm:py-12 lg:py-14"
      style={{ backgroundColor: "#FED6D6" }}
    >
      <BookAccents />

      <div className="relative flex flex-col items-center text-center max-w-2xl">
        <h1 className="mb-3 text-5xl font-extrabold tracking-tight text-black sm:text-6xl">
          CuratedByDer
        </h1>

        <p className="mb-8 max-w-xl text-lg text-muted-foreground">
          Lacak setiap buku yang kamu pesan. Masuk untuk cek status pesanan,
          pembayaran, dan pengiriman — semua dalam satu dashboard.
        </p>
      </div>

      <HomeLogin />

      <div className="mt-5 sm:mt-8 w-full max-w-3xl">
        <PhotoCarousel />
      </div>
    </main>
  );
}