import { NextResponse } from "next/server"
import { runCleanup } from "@/features/cart/services/cleanupService"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  findPendingManualOrdersOlderThan,
  findOrderItems,
  updateOrderStatus,
} from "@/features/orders/repositories/orderRepository"
import {
  incrementSkuStock,
  incrementProductStock,
} from "@/features/cart/repositories/stockRepository"
import { verificarLicencia } from "@/shared/actions/licenseActions"

export async function POST() {
  try {
    const adminClient = await createAdminClient()
    const results = {
      cleanup: await runCleanup(),
      manual_orders_processed: 0,
      manual_orders_errors: 0,
      license_checked: false,
    }

    // 1. Limpieza de carritos y órdenes Wompi huérfanas (vía runCleanup)
    
    // 2. Limpieza de Órdenes Manuales > 72 horas
    const cutoff72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
    const pendingManualOrders = await findPendingManualOrdersOlderThan(adminClient, cutoff72h)
    
    if (pendingManualOrders && pendingManualOrders.length > 0) {
      console.log(`[CRON] Found ${pendingManualOrders.length} PENDING_MANUAL orders to expire`)
      
      for (const order of pendingManualOrders) {
        try {
          const items = await findOrderItems(adminClient, order.id)

          for (const item of items) {
            if (item.variant_id) {
              await incrementSkuStock(adminClient, item.variant_id, item.quantity)
            } else {
              await incrementProductStock(adminClient, item.product_id, item.quantity)
            }
          }

          await updateOrderStatus(adminClient, order.id, "DECLINED")
          console.log(`[CRON] Manual order ${order.id} marked as DECLINED, stock restored`)
          results.manual_orders_processed++
        } catch (err) {
          console.error(`[CRON] Error processing manual order ${order.id}:`, err)
          results.manual_orders_errors++
        }
      }
    }

    // 3. Validación de Licencia PRIGMA
    try {
      await verificarLicencia()
      results.license_checked = true
    } catch (err) {
      console.error("[CRON] Error checking license:", err)
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Maintenance completed successfully`,
    })
  } catch (error) {
    console.error("Maintenance error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST only. Executes unified cron maintenance (cleanup, manual orders expiry, license validation).",
  })
}
