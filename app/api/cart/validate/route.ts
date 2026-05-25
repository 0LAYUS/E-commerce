import { validateCartItems } from "@/features/cart/services/cartValidator"
import { CartValidationRequest } from "@/features/cart/types/cart.types"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: NextRequest) {
  try {
    const body: CartValidationRequest = await request.json()
    const { items } = body

    const result = await validateCartItems(items || [])

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("Cart validation error:", error)
    return NextResponse.json(
      { success: false, message: "Validation error" },
      { status: 500 }
    )
  }
}