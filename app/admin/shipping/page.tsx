import { getShippingZones } from "@/features/admin/actions/adminActions"
import ShippingZonesGrid from "@/features/admin/components/ShippingZonesGrid"

export const runtime = 'edge'

export default async function ShippingPage() {
  const zones = await getShippingZones()
  return <ShippingZonesGrid zones={zones || []} />
}