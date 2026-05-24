"use client"

import { User, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { ROLE_DISPLAY_NAMES } from "@/lib/constants/users"
import type { UserType } from "@/features/auth/types/user.types"
import UserRoleMenu from "./UserRoleMenu"

type UserTableRowProps = {
  user: UserType
  isMenuOpen: boolean
  isUpdating: boolean
  onToggleMenu: () => void
  onRoleChange: (userId: string, role: "cliente" | "administrador") => void
  onViewDetails: (userId: string) => void
}

export default function UserTableRow({
  user,
  isMenuOpen,
  isUpdating,
  onToggleMenu,
  onRoleChange,
  onViewDetails,
}: UserTableRowProps) {
  return (
    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
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
              ? "bg-purple-muted text-purple"
              : "bg-muted text-muted-foreground"
          )}
        >
          {user.role === "administrador" ? <Shield className="w-3 h-3" /> : null}
          {ROLE_DISPLAY_NAMES[user.role]}
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
        <UserRoleMenu
          user={user}
          isOpen={isMenuOpen}
          isUpdating={isUpdating}
          onToggle={onToggleMenu}
          onRoleChange={onRoleChange}
          onViewDetails={onViewDetails}
        />
      </td>
    </tr>
  )
}
