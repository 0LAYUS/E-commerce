import { validateCartItems } from "@/lib/cart/cartValidator"
import { CartValidationRequest } from "@/lib/types/cart"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body: CartValidationRequest = await request.json()
    const { items } = body

    const result = await validateCartItems(items || [])

    return NextResponse.json(result)
  } catch (error) {
    console.error("Cart validation error:", error)
    return NextResponse.json(
      { success: false, message: "Validation error" },
      { status: 500 }
    )
  }
}