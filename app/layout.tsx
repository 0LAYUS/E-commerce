import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/components/providers/CartProvider";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Wompi E-commerce",
  description: "Tienda online básica con Next.js y Wompi",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased min-h-screen bg-background text-foreground flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Suspense fallback={<div className="h-16 border-b shadow-sm w-full top-0 bg-white" />}>
            <CartProvider>
              <Navbar />
              <main className="flex-grow px-0">
                {children}
              </main>
              <Footer />
            </CartProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
