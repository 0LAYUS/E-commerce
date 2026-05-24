export type UserRole = "cliente" | "administrador"

export type UserProfile = {
  id: string
  email: string
  role: UserRole
  created_at: string
}

export type ProfileData = {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  address?: string | null
}

export type UserType = {
  id: string
  email: string
  role: "cliente" | "administrador"
  created_at: string
  orderCount: number
}
