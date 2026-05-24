export const VARIANT_SUGGESTIONS: Record<string, string[]> = {
  color: ["Rojo", "Azul", "Verde", "Negro", "Blanco", "Amarillo", "Morado", "Naranja", "Rosa", "Gris"],
  talla: ["XS", "S", "M", "L", "XL", "XXL"],
  tamaño: ["XS", "S", "M", "L", "XL", "XXL"],
  material: ["Algodón", "Poliéster", "Lino", "Seda", "Cuero"],
  estilo: ["Clásico", "Moderno", "Casual", "Formal", "Deportivo"],
}

export function getVariantSuggestions(name: string): string[] {
  const lower = name.toLowerCase()
  for (const [key, values] of Object.entries(VARIANT_SUGGESTIONS)) {
    if (lower.includes(key)) return values
  }
  return []
}
