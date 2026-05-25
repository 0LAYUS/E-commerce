import { NextRequest, NextResponse } from "next/server"
import { validatePosItems } from "@/features/pos/services/posValidateService"

export const runtime = "edge"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body

    const result = await validatePosItems(items || [])

    return NextResponse.json(result)
  } catch (error) {
    console.error("POS validate error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}