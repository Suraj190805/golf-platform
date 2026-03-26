import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"
import { sendDrawResultsEmail, sendWinnerAlertEmail } from "@/lib/email"

// GET: Fetch draws (published for users, all for admins)
export async function GET(request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const month = searchParams.get("month")

  let query = supabase.from("draws").select("*").order("draw_date", { ascending: false })

  if (status) query = query.eq("status", status)
  if (month) query = query.eq("draw_month", month)

  const { data: draws, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ draws })
}

// POST: Create and run a draw (admin only)
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

  // Verify admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { draw_type = "random", simulate = false } = body

  const now = new Date()
  const drawMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  // Generate 5 winning numbers (1-45 range, Stableford)
  let winningNumbers
  if (draw_type === "algorithmic") {
    // Algorithmic: weighted by most/least frequent user scores
    const { data: allScores } = await supabase.from("scores").select("score")
    const frequency = {}
    ;(allScores || []).forEach(s => {
      frequency[s.score] = (frequency[s.score] || 0) + 1
    })

    // Create weighted pool — less frequent scores get higher weight
    const pool = []
    for (let i = 1; i <= 45; i++) {
      const weight = frequency[i] ? Math.max(1, 10 - frequency[i]) : 5
      for (let j = 0; j < weight; j++) pool.push(i)
    }

    const selected = new Set()
    while (selected.size < 5) {
      selected.add(pool[Math.floor(Math.random() * pool.length)])
    }
    winningNumbers = Array.from(selected).sort((a, b) => a - b)
  } else {
    // Random: standard lottery-style
    const selected = new Set()
    while (selected.size < 5) {
      selected.add(Math.floor(Math.random() * 45) + 1)
    }
    winningNumbers = Array.from(selected).sort((a, b) => a - b)
  }

  // Get previous jackpot rollover
  const { data: prevDraws } = await supabase
    .from("draws")
    .select("jackpot_rollover, prize_pool_total")
    .eq("status", "published")
    .order("draw_date", { ascending: false })
    .limit(1)

  const rollover = prevDraws?.[0]?.jackpot_rollover || 0

  // Calculate prize pool from active subscribers
  const { count: activeSubscribers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("subscription_status", "active")

  const subscriptionFee = 29.99 // monthly fee estimate
  const prizePoolPct = 0.5 // 50% of subscription goes to prize pool
  const totalPool = ((activeSubscribers || 0) * subscriptionFee * prizePoolPct) + rollover

  // Create draw record
  const drawStatus = simulate ? "simulated" : "pending"
  const { data: draw, error: drawError } = await supabase
    .from("draws")
    .insert([{
      draw_date: now.toISOString().split("T")[0],
      draw_month: drawMonth,
      status: drawStatus,
      draw_type,
      winning_numbers: winningNumbers,
      prize_pool_total: totalPool,
      jackpot_rollover: 0,
    }])
    .select()
    .single()

  if (drawError) {
    return NextResponse.json({ error: drawError.message }, { status: 500 })
  }

  // Calculate results for all eligible users (with 5 scores)
  const { data: allUsers } = await supabase
    .from("scores")
    .select("user_id, score")

  // Group scores by user
  const userScores = {}
  ;(allUsers || []).forEach(s => {
    if (!userScores[s.user_id]) userScores[s.user_id] = []
    userScores[s.user_id].push(s.score)
  })

  const results = []
  let fiveMatchWinners = 0
  let fourMatchWinners = 0
  let threeMatchWinners = 0

  for (const [userId, scores] of Object.entries(userScores)) {
    if (scores.length < 5) continue // need 5 scores to participate

    const userNums = scores.slice(0, 5)
    const matched = userNums.filter(s => winningNumbers.includes(s)).length

    if (matched >= 3) {
      results.push({
        draw_id: draw.id,
        user_id: userId,
        user_scores: userNums,
        matched_count: matched,
        prize_amount: 0, // calculated below
      })

      if (matched === 5) fiveMatchWinners++
      else if (matched === 4) fourMatchWinners++
      else if (matched === 3) threeMatchWinners++
    }
  }

  // Calculate prize amounts: 40% / 35% / 25% split
  const fiveMatchPool = totalPool * 0.4
  const fourMatchPool = totalPool * 0.35
  const threeMatchPool = totalPool * 0.25

  let jackpotRollover = 0
  if (fiveMatchWinners === 0) {
    jackpotRollover = fiveMatchPool // rollover if no 5-match winner
  }

  results.forEach(r => {
    if (r.matched_count === 5 && fiveMatchWinners > 0) {
      r.prize_amount = fiveMatchPool / fiveMatchWinners
    } else if (r.matched_count === 4 && fourMatchWinners > 0) {
      r.prize_amount = fourMatchPool / fourMatchWinners
    } else if (r.matched_count === 3 && threeMatchWinners > 0) {
      r.prize_amount = threeMatchPool / threeMatchWinners
    }
  })

  // Update draw with rollover
  await supabase
    .from("draws")
    .update({ jackpot_rollover: jackpotRollover })
    .eq("id", draw.id)

  // Insert results
  if (results.length > 0) {
    await supabase.from("draw_results").insert(results)
  }

  return NextResponse.json({
    draw: { ...draw, jackpot_rollover: jackpotRollover },
    results,
    summary: {
      winning_numbers: winningNumbers,
      total_pool: totalPool,
      five_match_winners: fiveMatchWinners,
      four_match_winners: fourMatchWinners,
      three_match_winners: threeMatchWinners,
      jackpot_rollover: jackpotRollover,
    },
  }, { status: 201 })
}

// PUT: Publish a draw (admin only)
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
  const { draw_id } = body

  if (!draw_id) {
    return NextResponse.json({ error: "draw_id required" }, { status: 400 })
  }

  const { data: draw, error: updateError } = await supabase
    .from("draws")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", draw_id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Send email notifications to all participants (non-blocking)
  try {
    const { data: drawResults } = await supabase
      .from("draw_results")
      .select("*, profiles(email, full_name)")
      .eq("draw_id", draw_id)

    if (drawResults?.length) {
      for (const result of drawResults) {
        const email = result.profiles?.email
        const name = result.profiles?.full_name
        if (!email) continue

        // Send draw results email
        sendDrawResultsEmail(email, name, {
          drawMonth: draw.draw_month,
          matchedCount: result.matched_count,
          prizeAmount: result.prize_amount,
          winningNumbers: draw.winning_numbers,
        }).catch(console.error)

        // Send extra winner alert for 3+ matches
        if (result.matched_count >= 3 && parseFloat(result.prize_amount) > 0) {
          sendWinnerAlertEmail(email, name, {
            prizeAmount: result.prize_amount,
            drawMonth: draw.draw_month,
            matchedCount: result.matched_count,
          }).catch(console.error)
        }
      }
    }
  } catch (emailErr) {
    console.error("Email notification error:", emailErr)
  }

  return NextResponse.json({ draw })
}
