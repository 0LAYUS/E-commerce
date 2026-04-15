import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PRIGMA_URL = process.env.PRIGMA_URL || "https://prigma.onrender.com"
const LICENSE_KEY = process.env.LICENSE_KEY || ""

async function signRequest(licenseKey: string, timestamp: number): Promise<string> {
  const canonical = `v1:${timestamp}:${licenseKey}:GET:/api/license/verify`
  const encoder = new TextEncoder()
  const keyData = encoder.encode(licenseKey)
  const canonicalData = encoder.encode(canonical)

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, canonicalData)
  const signatureArray = Array.from(new Uint8Array(signatureBuffer))
  return signatureArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function verificarLicenciaActiva(): Promise<boolean> {
  if (!LICENSE_KEY) return true

  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = await signRequest(LICENSE_KEY, timestamp)

    const res = await fetch(`${PRIGMA_URL}/api/license/verify`, {
      headers: {
        "x-license-key": LICENSE_KEY,
        "x-timestamp": String(timestamp),
        "x-signature": signature,
      },
    })

    if (!res.ok) return true

    const data = await res.json()
    return data.status === "active" || data.status === "trial" || data.status === "grace_period"
  } catch {
    return true
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (pathname.startsWith("/admin")) {
    const yaBloqueado = searchParams.get("bloqueado") === "si"

    if (!yaBloqueado) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.redirect(new URL("/login", request.url))
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (!profile || profile.role !== "administrador") {
        return NextResponse.redirect(new URL("/", request.url))
      }

      const licenciaActiva = await verificarLicenciaActiva()
      if (!licenciaActiva) {
        return NextResponse.redirect(new URL("/admin?bloqueado=si", request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
