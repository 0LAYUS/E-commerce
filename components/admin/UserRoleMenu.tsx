"use client"

import { User, Shield, MoreVertical, Eye } from "lucide-react"
import type { UserType } from "@/types/user.types"

type UserRoleMenuProps = {
  user: UserType
  isOpen: boolean
  isUpdating: boolean
  onToggle: () => void
  onRoleChange: (userId: string, role: "cliente" | "administrador") => void
  onViewDetails: (userId: string) => void
}

export default function UserRoleMenu({
  user,
  isOpen,
  isUpdating,
  onToggle,
  onRoleChange,
  onViewDetails,
}: UserRoleMenuProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onViewDetails(user.id)}
        className="p-2 text-muted-foreground hover:text-foreground transition"
        title="Ver detalles"
      >
        <Eye className="w-4 h-4" />
      </button>
      <div className="relative">
        <button
          onClick={onToggle}
          disabled={isUpdating}
          className="p-2 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={onToggle}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
              <button
                onClick={() => onRoleChange(user.id, "administrador")}
                disabled={isUpdating || user.role === "administrador"}
                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted/50 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-purple" />
                Hacer administrador
              </button>
              <button
                onClick={() => onRoleChange(user.id, "cliente")}
                disabled={isUpdating || user.role === "cliente"}
                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted/50 transition disabled:opacity-50 flex items-center gap-2"
              >
                <User className="w-4 h-4 text-muted-foreground" />
                Hacer cliente
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
