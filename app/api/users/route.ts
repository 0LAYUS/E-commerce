import { NextRequest, NextResponse } from "next/server"
import { getAllUsers } from "@/lib/actions/authActions"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)
    const role = searchParams.get("role") as "administrador" | "cliente" | null
    const search = searchParams.get("search") || undefined

    const result = await getAllUsers({
      limit,
      offset,
      role: role ?? undefined,
      search,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Error fetching users" },
      { status: 500 }
    )
  }
}