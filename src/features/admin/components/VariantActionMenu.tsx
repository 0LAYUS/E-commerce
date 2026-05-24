"use client"

import { MoreVertical, Archive, Trash2 } from "lucide-react"

type VariantActionMenuProps = {
  variantId: string
  open: boolean
  onToggle: () => void
  onAction: (variantId: string, skuCode: string) => void
  skuCode: string
  hasSales?: boolean
}

export function VariantActionMenu({ variantId, open, onToggle, onAction, skuCode, hasSales }: VariantActionMenuProps) {
  const isTemp = variantId.startsWith("temp-")

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="p-1.5 hover:bg-accent rounded transition text-muted-foreground hover:text-foreground"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
          {isTemp ? (
            <span className="px-3 py-2 text-xs text-muted-foreground">Sin acciones</span>
          ) : hasSales ? (
            <button
              type="button"
              onClick={() => onAction(variantId, skuCode)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
            >
              <Archive className="w-4 h-4" /> Archivar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAction(variantId, skuCode)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
