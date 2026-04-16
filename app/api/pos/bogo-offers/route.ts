import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

type BogoOfferBody = {
  name: string
  product_id?: string
  variant_id?: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "administrador") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: offers, error } = await supabase
      .from("pos_bogo_offers")
      .select("id, name, product_id, variant_id, active, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Bogo offers fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ offers: offers || [] })
  } catch (error) {
    console.error("Bogo offers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: BogoOfferBody = await request.json()
    const { name, product_id, variant_id } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "administrador") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const adminClient = await createAdminClient()

    const { data: offer, error } = await adminClient
      .from("pos_bogo_offers")
      .insert([{
        name,
        product_id: product_id || null,
        variant_id: variant_id || null,
        active: true,
      }])
      .select()
      .single()

    if (error) {
      console.error("Bogo offer create error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, offer })
  } catch (error) {
    console.error("Bogo offer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: { id: string; name?: string; active?: boolean } = await request.json()
    const { id, name, active } = body

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "administrador") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const adminClient = await createAdminClient()

    const updates: Record<string, any> = {}
    if (name !== undefined) updates.name = name
    if (active !== undefined) updates.active = active

    const { data: offer, error } = await adminClient
      .from("pos_bogo_offers")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Bogo offer update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, offer })
  } catch (error) {
    console.error("Bogo offer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "administrador") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const adminClient = await createAdminClient()

    const { error } = await adminClient
      .from("pos_bogo_offers")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Bogo offer delete error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Bogo offer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
