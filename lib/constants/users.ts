import type { FilterRole } from "@/types/admin.types"

export const ROLE_FILTER_LABELS: Record<FilterRole, string> = {
  all: "Todos",
  administrador: "Admin",
  cliente: "Cliente",
}

export const ROLE_DISPLAY_NAMES: Record<"administrador" | "cliente", string> = {
  administrador: "Admin",
  cliente: "Cliente",
}

export const USER_LIST_LIMIT = 50
