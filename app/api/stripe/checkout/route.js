import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerClient } from "@/lib/supabaseServer"

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set")
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
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
  const { plan } = body // 'monthly' or 'yearly'

  if (!plan || !["monthly", "yearly"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan. Choose 'monthly' or 'yearly'" }, { status: 400 })
  }

  let stripe
  try {
    stripe = getStripe()
  } catch (err) {
    console.error("Stripe init error:", err.message)
    return NextResponse.json({ error: "Payment service not configured" }, { status: 500 })
  }

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single()

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email || user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id)
  }

  // Price IDs — set these in your Stripe dashboard
  const priceId = plan === "monthly"
    ? process.env.STRIPE_MONTHLY_PRICE_ID
    : process.env.STRIPE_YEARLY_PRICE_ID

  if (!priceId) {
    return NextResponse.json({ error: "Price not configured. Set STRIPE_MONTHLY_PRICE_ID / STRIPE_YEARLY_PRICE_ID in env" }, { status: 500 })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://golf-platform-iota.vercel.app"}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://golf-platform-iota.vercel.app"}/subscribe?cancelled=true`,
      metadata: {
        supabase_user_id: user.id,
        plan,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Stripe checkout error:", err.message, err.type, err.statusCode)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

