"use client"

import { useState } from "react"
import { Shield, User, MoreVertical } from "lucide-react"

type UserType = {
  id: string
  email: string
  role: "cliente" | "administrador"
  created_at: string
}

type UserManagementProps = {
  users: UserType[]
  updateUserRole: (userId: string, role: "cliente" | "administrador") => Promise<void>
}

export default function UserManagement({ users, updateUserRole }: UserManagementProps) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: "cliente" | "administrador") => {
    setUpdating(userId)
    setOpenMenu(null)
    try {
      await updateUserRole(userId, newRole)
    } catch (err) {
      console.error("Error updating role:", err)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left p-4 font-medium text-muted-foreground">Usuario</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Rol</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Fecha de registro</th>
              <th className="text-left p-4 font-medium text-muted-foreground w-12"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-foreground">{user.email}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.role === "administrador"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {user.role === "administrador" ? (
                      <Shield className="w-3 h-3" />
                    ) : null}
                    {user.role === "administrador" ? "Administrador" : "Cliente"}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </td>
                <td className="p-4">
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
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
