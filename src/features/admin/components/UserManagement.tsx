"use client"

import { useState } from "react"
import { Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserDetailsModal } from "./UserDetailsModal"
import UserTableRow from "./UserTableRow"
import { useUserList } from "@/hooks/useUserList"
import { ROLE_FILTER_LABELS } from "@/lib/constants/users"
import type { UserType } from "@/features/auth/types/user.types"
import type { FilterRole } from "@/types/admin.types"

type UserManagementProps = {
  initialUsers: UserType[]
  totalUsers: number
  updateUserRole: (userId: string, role: "cliente" | "administrador") => Promise<void>
}

export default function UserManagement({
  initialUsers,
  totalUsers,
  updateUserRole,
}: UserManagementProps) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState<FilterRole>("all")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const {
    setUsers,
    totalFromServer,
    loading,
    loadingMore,
    displayedUsers,
    hasMore,
    loadMore,
  } = useUserList(initialUsers, totalUsers, search, filterRole)

  const handleRoleChange = async (userId: string, newRole: "cliente" | "administrador") => {
    setUpdating(userId)
    setOpenMenu(null)
    try {
      await updateUserRole(userId, newRole)
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
    } catch (err) {
      console.error("Error updating role:", err)
    } finally {
      setUpdating(null)
    }
  }

  const filterOptions: FilterRole[] = ["all", "administrador", "cliente"]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="flex gap-2">
          {filterOptions.map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition",
                filterRole === role
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {ROLE_FILTER_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left p-4 font-medium text-muted-foreground">Usuario</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Rol</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Órdenes</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Fecha de registro</th>
              <th className="text-left p-4 font-medium text-muted-foreground w-24">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {displayedUsers.map((user) => (
              <UserTableRow
                key={user.id}
                user={user}
                isMenuOpen={openMenu === user.id}
                isUpdating={updating === user.id}
                onToggleMenu={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                onRoleChange={handleRoleChange}
                onViewDetails={setSelectedUserId}
              />
            ))}
            {displayedUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  {loading ? "Cargando..." : "No se encontraron usuarios."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {displayedUsers.length} de {totalFromServer} usuarios
        </p>
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
            Cargar más
          </button>
        )}
      </div>

      {selectedUserId && (
        <UserDetailsModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  )
}
