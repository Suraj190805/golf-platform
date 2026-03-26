import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"

// GET: Fetch all charities (with optional search/filter)
export async function GET(request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")
  const category = searchParams.get("category")
  const featured = searchParams.get("featured")

  let query = supabase.from("charities").select("*").order("name")

  if (search) {
    query = query.ilike("name", `%${search}%`)
  }

  if (category) {
    query = query.eq("category", category)
  }

  if (featured === "true") {
    query = query.eq("is_featured", true)
  }

  const { data: charities, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ charities })
}

// POST: Create a charity (admin only)
export async function POST(request) {
  const supabase = createServerClient()
  const authHeader = request.headers.get("authorization")

  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.replace("Bearer ", "")
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check admin status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 })
  }

  const body = await request.json()
  const { name, description, image_url, website_url, category, is_featured } = body

  if (!name) {
    return NextResponse.json({ error: "Charity name is required" }, { status: 400 })
  }

  const { data: charity, error: insertError } = await supabase
    .from("charities")
    .insert([{ name, description, image_url, website_url, category, is_featured: is_featured || false }])
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ charity }, { status: 201 })
}

// PUT: Update a charity (admin only)
export async function PUT(request) {
  const supabase = createServerClient()
  const authHeader = request.headers.get("authorization")

  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.replace("Bearer ", "")
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: "Charity ID is required" }, { status: 400 })
  }

  const { data: charity, error: updateError } = await supabase
    .from("charities")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ charity })
}

// DELETE: Delete a charity (admin only)
export async function DELETE(request) {
  const supabase = createServerClient()
  const authHeader = request.headers.get("authorization")

  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.replace("Bearer ", "")
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Charity ID is required" }, { status: 400 })
  }

  const { error: deleteError } = await supabase
    .from("charities")
    .delete()
    .eq("id", id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
