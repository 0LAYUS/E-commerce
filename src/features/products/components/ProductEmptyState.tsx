import { MagnifyingGlass } from "@phosphor-icons/react"

type Props = {
  title?: string
  description?: string
}

export default function ProductEmptyState({
  title = "No se encontraron productos",
  description = "Intenta con otros términos de búsqueda o cambia de categoría.",
}: Props) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-card flex items-center justify-center">
        <MagnifyingGlass
          className="w-10 h-10 text-muted-foreground"
          weight="duotone"
        />
      </div>
      <h3 className="text-xl font-bold text-card-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
