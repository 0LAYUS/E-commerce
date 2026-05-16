import { NextRequest, NextResponse } from "next/server"
import { exportOrdersToCSV } from "@/features/orders/services/orderService"
import type { OrderStatus } from "@/types/order.types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const rawStatus = searchParams.get("status")
    const rawSearch = searchParams.get("search")

    const validStatuses: OrderStatus[] = ["PENDING", "APPROVED", "DECLINED", "ERROR"]
    const status: OrderStatus | "ALL" =
      rawStatus && validStatuses.includes(rawStatus as OrderStatus)
        ? (rawStatus as OrderStatus)
        : "ALL"

    const search = rawSearch ? rawSearch.slice(0, 200).trim() : ""

    const csv = await exportOrdersToCSV({ status, search })

    if (!csv) {
      return new NextResponse("", { status: 204 })
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}