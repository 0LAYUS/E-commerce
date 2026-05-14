import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getOrderById } from "@/lib/actions/orderActions"
import { OrderDetailsCard } from "@/components/admin/OrderDetailsCard"

export default async function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const order = await getOrderById(id)

  if (!order) {
    notFound()
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Órdenes
      </Link>

      {/* Order details */}
      <OrderDetailsCard order={order} />
    </div>
  )
}