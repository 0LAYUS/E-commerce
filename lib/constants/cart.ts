export const STATUS_BADGE_CONFIG: Record<string, { variant: "destructive" | "warning"; label: string }> = {
  product_inactive: { variant: "destructive", label: "Producto no disponible" },
  variant_inactive: { variant: "destructive", label: "Variante no disponible" },
  out_of_stock: { variant: "destructive", label: "Agotado" },
  price_changed: { variant: "warning", label: "Stock reducido" },
}

export const STATUS_MESSAGES: Record<string, (itemName: string, availableStock?: number) => string> = {
  product_inactive: (itemName) => `El producto "${itemName}" ya no está disponible y fue removido del inventario.`,
  variant_inactive: (itemName) => `La variante de "${itemName}" ya no está disponible. Puede que otras tallas o colores sigan activas.`,
  out_of_stock: (itemName) => `El producto "${itemName}" está agotado y no puede ser purchased.`,
  price_changed: (itemName, availableStock) => `El stock para "${itemName}" se redujo a ${availableStock} unidades. La cantidad fue ajustada automáticamente.`,
}
