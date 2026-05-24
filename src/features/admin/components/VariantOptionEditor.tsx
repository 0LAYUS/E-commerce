"use client"

import { X } from "lucide-react"
import { getVariantSuggestions } from "@/lib/constants/variants"

type VariantOptionEditorProps = {
  index: number
  name: string
  values: string[]
  onNameChange: (index: number, name: string) => void
  onRemove: (index: number) => void
  onAddValue: (index: number, value: string) => void
  onRemoveValue: (optIndex: number, valIndex: number) => void
}

export function VariantOptionEditor({
  index,
  name,
  values,
  onNameChange,
  onRemove,
  onAddValue,
  onRemoveValue,
}: VariantOptionEditorProps) {
  const suggestions = getVariantSuggestions(name)

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(index, e.target.value)}
          placeholder="Nombre (ej: Color, Talla)"
          className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-2 text-muted-foreground hover:text-destructive transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {values.map((val, vIndex) => (
          <span
            key={vIndex}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm"
          >
            {val}
            <button
              type="button"
              onClick={() => onRemoveValue(index, vIndex)}
              className="text-muted-foreground hover:text-foreground ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Agregar valor y presiona Enter..."
          className="flex-1 min-w-[150px] h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              const input = e.target as HTMLInputElement
              onAddValue(index, input.value)
              input.value = ""
            }
          }}
        />
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onAddValue(index, s)}
            className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-accent transition"
          >
            + {s}
          </button>
        ))}
      </div>
    </div>
  )
}
