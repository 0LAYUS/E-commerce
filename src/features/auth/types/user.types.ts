export type UserRole = "cliente" | "administrador"

export type UserProfile = {
  id: string
  email: string
  role: UserRole
  created_at: string
}
