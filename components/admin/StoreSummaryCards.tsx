type StoreSummaryCardsProps = {
  categoriesCount: number | null
  productsCount: number | null
  ordersCount: number | null
}

export default function StoreSummaryCards({ categoriesCount, productsCount, ordersCount }: StoreSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-[var(--bg-surface)] p-6 rounded-xl shadow-sm border">
        <h3 className="text-[var(--text-muted)] font-medium">Categorías Activas</h3>
        <p className="text-3xl font-bold text-[var(--text-primary)] mt-2">{categoriesCount || 0}</p>
      </div>
      <div className="bg-[var(--bg-surface)] p-6 rounded-xl shadow-sm border">
        <h3 className="text-[var(--text-muted)] font-medium">Total Productos</h3>
        <p className="text-3xl font-bold text-[var(--text-primary)] mt-2">{productsCount || 0}</p>
      </div>
      <div className="bg-[var(--bg-surface)] p-6 rounded-xl shadow-sm border">
        <h3 className="text-[var(--text-muted)] font-medium">Total Órdenes</h3>
        <p className="text-3xl font-bold text-[var(--text-primary)] mt-2">{ordersCount || 0}</p>
      </div>
    </div>
  )
}
