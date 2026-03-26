"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

// Reusable auth guard hook
// Usage: const { user, profile, loading } = useAuth({ requireAdmin: false })
export function useAuth({ requireAdmin = false } = {}) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/auth/login")
        return
      }

      setUser(authUser)

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (requireAdmin && !profileData?.is_admin) {
        router.push("/dashboard")
        return
      }

      setProfile(profileData)
      setLoading(false)
    }

    check()
  }, [router, requireAdmin])

  return { user, profile, loading }
}
