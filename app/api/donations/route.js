import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"

export async function GET(request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("donations")
    .select("*, charities(name, category)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

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
  const { charity_id, amount } = body

  if (!charity_id || !amount || amount <= 0) {
    return NextResponse.json({ error: "Valid charity_id and amount required" }, { status: 400 })
  }

  if (amount > 10000) {
    return NextResponse.json({ error: "Maximum donation is £10,000" }, { status: 400 })
  }

  // Verify charity exists
  const { data: charity } = await supabase
    .from("charities")
    .select("id, name")
    .eq("id", charity_id)
    .single()

  if (!charity) {
    return NextResponse.json({ error: "Charity not found" }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("donations")
    .insert([{ user_id: user.id, charity_id, amount }])
    .select("*, charities(name)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
