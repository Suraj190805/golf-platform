import { createClient } from "@supabase/supabase-js"
import { sendWelcomeEmail } from "@/lib/email"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  const { email, password, fullName } = await req.json()

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    })
  }

  // Send welcome email (non-blocking)
  sendWelcomeEmail(email, fullName).catch(console.error)

  return new Response(JSON.stringify({ user: data.user }), {
    status: 200,
  })
}
