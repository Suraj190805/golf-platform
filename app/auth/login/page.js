"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        setError(loginError.message)
        setLoading(false)
        return
      }

      router.push("/dashboard")
    } catch (err) {
      setError("Unable to connect to the server. Please check your internet connection and try again.")
      setLoading(false)
      return
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: "calc(100vh - 72px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute",
        top: "10%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "500px",
        height: "500px",
        background: "radial-gradient(circle, rgba(0, 206, 201, 0.1) 0%, transparent 70%)",
        borderRadius: "50%",
        pointerEvents: "none",
      }} />

      <div className="animate-fade-in-up" style={{
        width: "100%",
        maxWidth: "440px",
        position: "relative",
        zIndex: 1,
        opacity: 0,
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "14px",
            background: "var(--gradient-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "1.2rem",
            color: "white",
            margin: "0 auto 20px",
          }}>G</div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "8px" }}>
            Welcome Back
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{
          background: "var(--gradient-card)",
          border: "1px solid var(--surface-border)",
          borderRadius: "var(--radius-lg)",
          padding: "36px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}>
          {error && (
            <div style={{
              background: "rgba(225, 112, 85, 0.1)",
              border: "1px solid rgba(225, 112, 85, 0.3)",
              borderRadius: "var(--radius)",
              padding: "12px 16px",
              color: "var(--error)",
              fontSize: "0.875rem",
            }}>
              {error}
            </div>
          )}

          <div>
            <label className="input-label">Email Address</label>
            <input
              className="input"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "4px",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Footer link */}
        <p style={{
          textAlign: "center",
          marginTop: "24px",
          color: "var(--text-muted)",
          fontSize: "0.9rem",
        }}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" style={{ color: "var(--primary-light)", textDecoration: "none", fontWeight: 500 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}