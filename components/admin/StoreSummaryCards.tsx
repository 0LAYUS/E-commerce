import { Tag, Package, ShoppingCart } from "lucide-react"
import { MetricCard } from "@/components/admin/MetricCard"

type StoreSummaryCardsProps = {
  categoriesCount: number | null
  productsCount: number | null
  ordersCount: number | null
}

export default function StoreSummaryCards({ categoriesCount, productsCount, ordersCount }: StoreSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <MetricCard
        title="Categorías Activas"
        value={categoriesCount || 0}
        icon={<Tag className="w-5 h-5" />}
      />
      <MetricCard
        title="Total Productos"
        value={productsCount || 0}
        icon={<Package className="w-5 h-5" />}
      />
      <MetricCard
        title="Total Órdenes"
        value={ordersCount || 0}
        icon={<ShoppingCart className="w-5 h-5" />}
      />
    </div>
  )
}
