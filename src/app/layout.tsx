import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SuccessModalProvider } from "@/components/SuccessModal";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CuratedByDer",
  description: "Bookstore inventory and order tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <SuccessModalProvider>
          {children}
        </SuccessModalProvider>
        <Toaster richColors />
        <Analytics />
      </body>
    </html>
  );
}