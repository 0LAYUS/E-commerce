import { NextResponse } from "next/server"
import { verificarLicencia } from "@/shared/actions/licenseActions"

export async function GET() {
  try {
    const { blocked, mensaje } = await verificarLicencia()

    return NextResponse.json({ blocked, mensaje })
  } catch {
    return NextResponse.json({
      blocked: true,
      mensaje: {
        title: "ERROR DE VERIFICACIÓN",
        description: "No se pudo verificar la licencia. Comunícate con PRIGMA.",
        status: "cancelled",
      },
    })
  }
}
