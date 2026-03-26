import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createServerClient } from "@/lib/supabaseServer"

export const maxDuration = 30

// POST: Verify a checkout session and sync subscription status
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
  const { session_id } = body

  if (!session_id) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 })
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(session_id, {
      expand: ["subscription"],
    })

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
    }

    const subscription = session.subscription
    const plan = session.metadata?.plan || "monthly"

    let periodEnd = null
    if (typeof subscription === "object" && subscription.current_period_end) {
      periodEnd = new Date(subscription.current_period_end * 1000)
    } else {
      periodEnd = new Date()
      if (plan === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      }
    }

    const updates = {
      subscription_status: "active",
      subscription_plan: plan,
      stripe_customer_id: session.customer,
      stripe_subscription_id: typeof subscription === "string" ? subscription : subscription?.id,
      subscription_start: new Date().toISOString().split("T")[0],
      subscription_end: periodEnd.toISOString().split("T")[0],
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ status: "active", plan })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
