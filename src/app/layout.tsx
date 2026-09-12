import type { Metadata } from "next";
import { connection } from "next/server";
import { Inter } from "next/font/google";
import "./globals.css";
import { SuccessModalProvider } from "@/components/SuccessModal";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CuratedByDer",
  description: "Bookstore inventory and order tracking.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // CSP nonce (proxy.ts) is per request: every page must render dynamically
  // so Next.js can stamp the current nonce onto its bootstrap scripts.
  await connection();

  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <SuccessModalProvider>{children}</SuccessModalProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}