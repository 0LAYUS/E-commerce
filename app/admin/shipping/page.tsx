import { getShippingZones } from "@/lib/actions/adminActions"
import ShippingZonesGrid from "@/components/admin/ShippingZonesGrid"

export default async function ShippingPage() {
  const zones = await getShippingZones()
  return <ShippingZonesGrid zones={zones || []} />
}