"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Shield, User, MoreVertical, Search, Eye, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserDetailsModal } from "./UserDetailsModal"

type UserType = {
  id: string
  email: string
  role: "cliente" | "administrador"
  created_at: string
  orderCount: number
}

type UserManagementProps = {
  initialUsers: UserType[]
  totalUsers: number
  updateUserRole: (userId: string, role: "cliente" | "administrador") => Promise<void>
}

type FilterRole = "all" | "administrador" | "cliente"

export default function UserManagement({
  initialUsers,
  totalUsers,
  updateUserRole,
}: UserManagementProps) {
  const [users, setUsers] = useState<UserType[]>(initialUsers)
  const [displayedCount, setDisplayedCount] = useState(initialUsers.length)
  const [totalFromServer, setTotalFromServer] = useState(totalUsers)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState<FilterRole>("all")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const LIMIT = 50

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Server-side search: when debouncedSearch changes, fetch fresh results
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setDisplayedCount(0)
      setUsers([])

      try {
        const params = new URLSearchParams()
        params.set("limit", String(LIMIT))
        params.set("offset", "0")
        if (filterRole !== "all") params.set("role", filterRole)
        if (debouncedSearch) params.set("search", debouncedSearch)

        const res = await fetch(`/api/users?${params.toString()}`)
        const data = await res.json()

        if (data.users) {
          setUsers(data.users)
          setDisplayedCount(data.users.length)
          setTotalFromServer(data.total)
        }
      } catch (err) {
        console.error("Error fetching users:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [debouncedSearch, filterRole])

  // Filter users client-side (only for role filter, search is server-side)
  const displayedUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole = filterRole === "all" || user.role === filterRole
      return matchesRole
    })
  }, [users, filterRole])

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

  const loadMore = async () => {
    if (loadingMore || displayedCount >= totalFromServer) return

    setLoadingMore(true)
    try {
      const offset = displayedCount
      const params = new URLSearchParams()
      params.set("limit", String(LIMIT))
      params.set("offset", String(offset))
      if (filterRole !== "all") params.set("role", filterRole)
      if (debouncedSearch) params.set("search", debouncedSearch)

      const res = await fetch(`/api/users?${params.toString()}`)
      const data = await res.json()

      if (data.users) {
        setUsers((prev) => [...prev, ...data.users])
        setDisplayedCount((prev) => prev + data.users.length)
      }
    } catch (err) {
      console.error("Error loading more users:", err)
    } finally {
      setLoadingMore(false)
    }
  }

  const hasMore = displayedCount < totalFromServer

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
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

        {/* Role Filter */}
        <div className="flex gap-2">
          {(["all", "administrador", "cliente"] as FilterRole[]).map((role) => (
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
              {role === "all" ? "Todos" : role === "administrador" ? "Admin" : "Cliente"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
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
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-foreground truncate max-w-[150px]">
                      {user.email.split("@")[0]}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground truncate max-w-[180px]">
                  {user.email}
                </td>
                <td className="p-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      user.role === "administrador"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    )}
                  >
                    {user.role === "administrador" ? <Shield className="w-3 h-3" /> : null}
                    {user.role === "administrador" ? "Admin" : "Cliente"}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  {user.orderCount}
                </td>
                <td className="p-4 text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedUserId(user.id)}
                      className="p-2 text-muted-foreground hover:text-foreground transition"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                        disabled={updating === user.id}
                        className="p-2 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenu === user.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenu(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
                            <button
                              onClick={() => handleRoleChange(user.id, "administrador")}
                              disabled={updating === user.id || user.role === "administrador"}
                              className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted/50 transition disabled:opacity-50 flex items-center gap-2"
                            >
                              <Shield className="w-4 h-4 text-purple-500" />
                              Hacer administrador
                            </button>
                            <button
                              onClick={() => handleRoleChange(user.id, "cliente")}
                              disabled={updating === user.id || user.role === "cliente"}
                              className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted/50 transition disabled:opacity-50 flex items-center gap-2"
                            >
                              <User className="w-4 h-4 text-gray-500" />
                              Hacer cliente
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
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

      {/* Pagination */}
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

      {/* User Details Modal */}
      {selectedUserId && (
        <UserDetailsModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  )
}