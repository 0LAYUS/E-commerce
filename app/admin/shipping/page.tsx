import { getShippingZones } from "@/features/admin/actions/adminActions"
import ShippingZonesGrid from "@/features/admin/components/ShippingZonesGrid"

export default async function ShippingPage() {
  const zones = await getShippingZones()
  return <ShippingZonesGrid zones={zones || []} />
}