/**
 * Shared HMAC-SHA256 request signing utility for Prigma license verification.
 * Uses the Web Crypto API so it is compatible with both Node.js (server actions)
 * and the Next.js Edge Runtime (middleware).
 */
export async function signLicenseRequest(licenseKey: string, timestamp: number): Promise<string> {
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
