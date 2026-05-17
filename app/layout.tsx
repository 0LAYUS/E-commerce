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
  : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Prigma Comercio"
const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Tienda online — Encuentra los mejores productos con envío a toda Colombia."

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName,
    title: siteName,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
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
      <body className={`${geistSans.className} antialiased min-h-screen bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Suspense fallback={<div className="h-16 border-b shadow-sm w-full top-0 bg-white" />}>
            <CartProvider>
              {children}
            </CartProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
