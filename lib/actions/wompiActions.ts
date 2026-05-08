"use server"

import crypto from "crypto"

/**
 * Genera la firma de integridad requerida por Wompi.
 * Se calcula en el servidor con la llave de integridad (SECRETA).
 * Formato: SHA256(reference + amountInCents + currency + integritySecret)
 *
 * Documentación: https://docs.wompi.co/docs/en/widget#4-generate-signature
 */
export async function getWompiIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string = "COP"
): Promise<string> {
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET

  if (!integritySecret || integritySecret.startsWith("test_integrity_REEMPLAZAR")) {
    // En desarrollo sin llaves reales, devolvemos un placeholder
    // El widget en sandbox puede funcionar sin firma, pero en producción es obligatoria
    console.warn("[Wompi] WOMPI_INTEGRITY_SECRET no configurado. La firma de integridad es requerida en producción.")
    return ""
  }

  const stringToHash = `${reference}${amountInCents}${currency}${integritySecret}`
  const hash = crypto.createHash("sha256").update(stringToHash).digest("hex")
  return hash
}
