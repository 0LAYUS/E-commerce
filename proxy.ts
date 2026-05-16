import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { signLicenseRequest } from "@/shared/utils/sign-request"

const PRIGMA_URL = process.env.PRIGMA_URL || "https://prisma.onrender.com"
const LICENSE_KEY = process.env.LICENSE_KEY || ""
const LICENSE_CACHE_SECONDS = 300

async function verificarLicenciaActiva(request: NextRequest): Promise<boolean> {
  if (!LICENSE_KEY) return true

  const cachedStatus = request.cookies.get("_license_status")?.value
  if (cachedStatus) {
    const cached = JSON.parse(cachedStatus)
    if (Date.now() / 1000 < cached.expiresAt) {
      return cached.active
    }
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = await signLicenseRequest(LICENSE_KEY, timestamp)

    const res = await fetch(`${PRIGMA_URL}/api/license/verify`, {
      headers: {
        "x-license-key": LICENSE_KEY,
        "x-timestamp": String(timestamp),
        "x-signature": signature,
      },
    })

    if (!res.ok) return true

    const data = await res.json()
    const active = data.status === "active" || data.status === "trial" || data.status === "grace_period"

    const response = NextResponse.next()
    response.cookies.set("_license_status", JSON.stringify({
      active,
      expiresAt: (Date.now() / 1000) + LICENSE_CACHE_SECONDS,
    }), {
      maxAge: LICENSE_CACHE_SECONDS,
      httpOnly: true,
      sameSite: "lax",
    })
    return active
  } catch {
    return true
  }
}

export async function proxy(request: NextRequest) {
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

      const licenciaActiva = await verificarLicenciaActiva(request)
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