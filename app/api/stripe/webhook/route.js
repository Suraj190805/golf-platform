import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createServerClient } from "@/lib/supabaseServer"

export const maxDuration = 30

export async function POST(request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  let event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createServerClient()
  const stripe = getStripe()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      const userId = session.metadata?.supabase_user_id
      const plan = session.metadata?.plan
      const subscriptionId = session.subscription

      if (userId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const periodEnd = new Date(subscription.current_period_end * 1000)

        await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
            subscription_plan: plan,
            stripe_subscription_id: subscriptionId,
            subscription_start: new Date().toISOString().split("T")[0],
            subscription_end: periodEnd.toISOString().split("T")[0],
          })
          .eq("id", userId)
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object
      const customerId = subscription.customer

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single()

      if (profile) {
        const status = subscription.status === "active" ? "active" : "lapsed"
        const periodEnd = new Date(subscription.current_period_end * 1000)

        await supabase
          .from("profiles")
          .update({
            subscription_status: status,
            subscription_end: periodEnd.toISOString().split("T")[0],
          })
          .eq("id", profile.id)
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object
      const customerId = subscription.customer

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single()

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            subscription_status: "cancelled",
            stripe_subscription_id: null,
          })
          .eq("id", profile.id)
      }
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object
      const customerId = invoice.customer

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single()

      if (profile) {
        await supabase
          .from("profiles")
          .update({ subscription_status: "lapsed" })
          .eq("id", profile.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
