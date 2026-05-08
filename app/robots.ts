import type { MetadataRoute } from "next"

const baseUrl =
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Bloquear rutas privadas para que Google no las indexe
        disallow: ["/admin/", "/api/", "/checkout/", "/cart/", "/profile/", "/pos/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
