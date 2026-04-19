export type LicenseStatus = "trial" | "active" | "grace_period" | "suspended" | "cancelled"

export type VerifyResponse = {
  status: LicenseStatus
  blocked: boolean
}

export type MensajeResponse = {
  title: string
  description: string
  status: LicenseStatus
}
