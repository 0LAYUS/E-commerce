import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { OrderStatus } from "@/features/orders/types/order.types"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const rawStatus = searchParams.get("status")
    const rawSearch = searchParams.get("search")

    // Validate status
    const validStatuses: OrderStatus[] = ["PENDING", "APPROVED", "DECLINED", "ERROR"]
    const status: OrderStatus | "ALL" =
      rawStatus && validStatuses.includes(rawStatus as OrderStatus)
        ? (rawStatus as OrderStatus)
        : "ALL"

    // Validate search
    const search = rawSearch ? rawSearch.slice(0, 200).trim() : ""

    const supabase = await createClient()

    let query = supabase
      .from("orders")
      .select("id, customer_name, customer_email, created_at, status, total_amount, wompi_transaction_id")

    // Filters
    if (status !== "ALL") {
      query = query.eq("status", status)
    }

    if (search) {
      const searchTerm = `%${search}%`
      query = query.or(
        `customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm},wompi_transaction_id.ilike.${searchTerm}`
      )
    }

    query = query.order("created_at", { ascending: false })

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return new NextResponse("", { status: 204 })
    }

    // CSV Header
    const headers = ["ID", "Cliente", "Email", "Fecha", "Hora", "Estado", "Total (COP)", "Wompi ID"]
    const headerRow = headers.join(",")

    // Generate rows
    const rows = data.map((order) => {
      const createdDate = new Date(order.created_at)
      const dateStr = createdDate.toLocaleDateString("es-CO")
      const timeStr = createdDate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
      const totalStr = (order.total_amount / 100).toFixed(2)

      return [
        order.id,
        `"${(order.customer_name || "").replace(/"/g, '""')}"`,
        `"${(order.customer_email || "").replace(/"/g, '""')}"`,
        dateStr,
        timeStr,
        order.status,
        totalStr,
        order.wompi_transaction_id ?? "",
      ].join(",")
    })

    const csv = headerRow + "\n" + rows.join("\n")

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