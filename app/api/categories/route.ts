import { NextResponse } from "next/server"
import { getAllCategories } from "@/features/categories/services/categoryService"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const categories = await getAllCategories()
    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Categories error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
