import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"
import { sendWelcomeEmail } from "@/lib/email"

// POST: Admin-only email test endpoint
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

  // Admin check
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, email, full_name")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Send a test welcome email to the admin
  const result = await sendWelcomeEmail(profile.email, profile.full_name || "Admin")

  if (result.success) {
    return NextResponse.json({ message: "Test email sent successfully", to: profile.email })
  } else {
    return NextResponse.json({ error: "Email send failed", details: result.error?.message }, { status: 500 })
  }
}
