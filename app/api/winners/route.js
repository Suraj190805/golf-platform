import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"

// GET: Fetch winner verifications
export async function GET(request) {
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

  // Check if admin for full list, otherwise only own
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  let query = supabase
    .from("winner_verifications")
    .select("*, profiles(full_name, email), draw_results(matched_count, prize_amount, draws(draw_month, winning_numbers))")
    .order("created_at", { ascending: false })

  if (!profile?.is_admin) {
    query = query.eq("user_id", user.id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ verifications: data })
}

// POST: Submit proof (winner only)
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

  const body = await request.json()
  const { draw_result_id, proof_image_url } = body

  if (!draw_result_id) {
    return NextResponse.json({ error: "Draw result ID is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("winner_verifications")
    .insert([{
      draw_result_id,
      user_id: user.id,
      proof_image_url,
      status: "pending",
      payment_status: "pending",
    }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ verification: data }, { status: 201 })
}

// PUT: Admin review (approve/reject) and mark payment
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
  const { id, status, payment_status, admin_notes } = body

  if (!id) {
    return NextResponse.json({ error: "Verification ID is required" }, { status: 400 })
  }

  const updates = {}
  if (status) updates.status = status
  if (payment_status) updates.payment_status = payment_status
  if (admin_notes !== undefined) updates.admin_notes = admin_notes
  updates.reviewed_at = new Date().toISOString()

  const { data, error: updateError } = await supabase
    .from("winner_verifications")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ verification: data })
}
