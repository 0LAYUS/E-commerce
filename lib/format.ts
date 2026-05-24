const CURRENCY_LOCALE = "es-CO"
const CURRENCY_CODE = "COP"

export function formatPrice(price: number): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: CURRENCY_CODE,
    minimumFractionDigits: 0,
  }).format(price)
}

export function formatStockLabel(stock: number): string {
  if (stock <= 0) return "Agotado"
  if (stock < 5) return `Ultimas ${stock} unidades`
  return `${stock} unidades`
}
