"use client"

import { useEffect, useState } from "react"
import { LicenseOverlay } from "@/components/license/LicenseOverlay"
import type { MensajeResponse } from "@/types/license.types"

type LicenseState = {
  blocked: boolean
  mensaje: MensajeResponse | null
}

export function LicenseProvider({ children }: { children: React.ReactNode }) {
  const [licenseState, setLicenseState] = useState<LicenseState>({
    blocked: false,
    mensaje: null,
  })

  useEffect(() => {
    async function verificarLicencia() {
      try {
        const res = await fetch("/api/licencia/check")
        if (!res.ok) return

        const data = await res.json()
        setLicenseState({
          blocked: data.blocked,
          mensaje: data.mensaje,
        })
      } catch {
        // Silently fail - don't block on error
      }
    }

    verificarLicencia()

    const interval = setInterval(verificarLicencia, 15 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  if (licenseState.blocked && licenseState.mensaje) {
    return <LicenseOverlay mensaje={licenseState.mensaje} />
  }

  return <>{children}</>
}
