import { NextResponse } from "next/server"
import { verificarLicencia } from "@/lib/actions/licenseActions"

export async function GET() {
  try {
    const { blocked, mensaje } = await verificarLicencia()

    return NextResponse.json({ blocked, mensaje })
  } catch {
    return NextResponse.json({ blocked: false, mensaje: null })
  }
}
