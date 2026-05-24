import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  getBogoOffers,
  createBogoOffer,
  updateBogoOffer,
  deleteBogoOffer,
} from "@/features/pos/services/posBogoOfferService"

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "administrador") throw new Error("Forbidden")
  return user.id
}

export async function GET() {
  try {
    const supabase = await createClient()
    await requireAdmin(supabase)

    const offers = await getBogoOffers()
    return NextResponse.json({ offers })
  } catch (error) {
    const message = (error as Error).message
    if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 })
    if (message === "Forbidden") return NextResponse.json({ error: message }, { status: 403 })
    console.error("Bogo offers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    await requireAdmin(supabase)

    const body = await request.json()
    const { name, product_id, variant_id } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const offer = await createBogoOffer(name, product_id, variant_id)
    return NextResponse.json({ success: true, offer })
  } catch (error) {
    const message = (error as Error).message
    if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 })
    if (message === "Forbidden") return NextResponse.json({ error: message }, { status: 403 })
    console.error("Bogo offer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    await requireAdmin(supabase)

    const body = await request.json()
    const { id, name, active } = body

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const offer = await updateBogoOffer(id, { name, active })
    return NextResponse.json({ success: true, offer })
  } catch (error) {
    const message = (error as Error).message
    if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 })
    if (message === "Forbidden") return NextResponse.json({ error: message }, { status: 403 })
    console.error("Bogo offer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    await requireAdmin(supabase)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    await deleteBogoOffer(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = (error as Error).message
    if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 })
    if (message === "Forbidden") return NextResponse.json({ error: message }, { status: 403 })
    console.error("Bogo offer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}