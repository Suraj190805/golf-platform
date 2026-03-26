import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"

// GET: Fetch user's scores (max 5, reverse chronological)
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

  const { data: scores, error } = await supabase
    .from("scores")
    .select("*")
    .eq("user_id", user.id)
    .order("played_date", { ascending: false })
    .limit(5)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ scores })
}

// POST: Add a new score (auto-replace oldest if 5 exist)
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
  const { score, played_date } = body

  // Validate score range
  if (!score || score < 1 || score > 45) {
    return NextResponse.json({ error: "Score must be between 1 and 45 (Stableford format)" }, { status: 400 })
  }

  if (!played_date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 })
  }

  // Check current score count
  const { data: existingScores, error: fetchError } = await supabase
    .from("scores")
    .select("id, played_date")
    .eq("user_id", user.id)
    .order("played_date", { ascending: true })

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  // If user already has 5 scores, delete the oldest
  if (existingScores && existingScores.length >= 5) {
    const oldestScore = existingScores[0]
    await supabase.from("scores").delete().eq("id", oldestScore.id)
  }

  // Insert new score
  const { data: newScore, error: insertError } = await supabase
    .from("scores")
    .insert([{ user_id: user.id, score, played_date }])
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ score: newScore }, { status: 201 })
}

// PUT: Update an existing score
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

  const body = await request.json()
  const { id, score, played_date } = body

  if (!id) {
    return NextResponse.json({ error: "Score ID is required" }, { status: 400 })
  }

  if (score && (score < 1 || score > 45)) {
    return NextResponse.json({ error: "Score must be between 1 and 45" }, { status: 400 })
  }

  const updates = {}
  if (score) updates.score = score
  if (played_date) updates.played_date = played_date

  const { data: updatedScore, error: updateError } = await supabase
    .from("scores")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ score: updatedScore })
}
