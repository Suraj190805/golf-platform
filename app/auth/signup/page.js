"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Signup() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSignup = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || "Signup failed")
        setLoading(false)
        return
      }

      router.push("/auth/login")
    } catch (err) {
      setError("Unable to connect to the server. Please try again.")
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
      background: "radial-gradient(circle, rgba(108, 92, 231, 0.1) 0%, transparent 70%)",
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
          Create Your Account
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Join the platform where golf meets generosity
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSignup} style={{
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
          <label className="input-label">Full Name</label>
          <input
            className="input"
            type="text"
            placeholder="John Smith"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

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
            placeholder="Min 6 characters"
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
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      {/* Footer link */}
      <p style={{
        textAlign: "center",
        marginTop: "24px",
        color: "var(--text-muted)",
        fontSize: "0.9rem",
      }}>
        Already have an account?{" "}
        <Link href="/auth/login" style={{ color: "var(--primary-light)", textDecoration: "none", fontWeight: 500 }}>
          Sign in
        </Link>
      </p>
    </div>
  </div>
)
}