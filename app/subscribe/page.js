"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SubscribePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(null) // 'monthly' | 'yearly' | null
  const [error, setError] = useState("")

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    getUser()
  }, [])

  const handleSubscribe = async (plan) => {
    if (!user) {
      router.push("/auth/signup")
      return
    }

    setLoading(plan)
    setError("")

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || "Failed to create checkout session")
        setLoading(null)
        return
      }

      // Redirect to Stripe Checkout
      window.location.href = result.url
    } catch (err) {
      setError("Unable to connect. Please try again.")
      setLoading(null)
    }
  }

  return (
    <div style={{ padding: "32px 0", minHeight: "calc(100vh - 72px)" }}>
      <div className="container" style={{ maxWidth: "900px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span className="badge badge-primary" style={{ marginBottom: "12px" }}>Subscription Plans</span>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginTop: "12px" }}>
            Choose Your <span className="gradient-text">Plan</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "12px", fontSize: "1.05rem", maxWidth: "480px", margin: "12px auto 0" }}>
            Subscribe to enter monthly prize draws and support a charity you believe in.
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(225, 112, 85, 0.1)",
            border: "1px solid rgba(225, 112, 85, 0.3)",
            borderRadius: "var(--radius)",
            padding: "12px 20px",
            color: "var(--error)",
            fontSize: "0.9rem",
            textAlign: "center",
            marginBottom: "24px",
          }}>
            {error}
          </div>
        )}

        {/* Plans */}
        <div className="subscribe-grid" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "48px",
        }}>
          {/* Monthly Plan */}
          <div className="card" style={{
            padding: "40px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "12px",
            }}>Monthly</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
              <span style={{ fontSize: "3rem", fontWeight: 800, color: "var(--foreground)" }}>£9.99</span>
              <span style={{ color: "var(--text-muted)", fontSize: "1rem" }}>/month</span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "28px" }}>
              Cancel anytime. No commitment.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginBottom: "28px", textAlign: "left" }}>
              {[
                "Monthly prize draw entry",
                "Score tracking & management",
                "Choose your charity (10% min)",
                "Full dashboard access",
              ].map((feature, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: "var(--success)", fontSize: "0.9rem" }}>✓</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSubscribe("monthly")}
              className="btn-secondary"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                opacity: loading === "monthly" ? 0.7 : 1,
              }}
            >
              {loading === "monthly" ? "Redirecting..." : "Subscribe Monthly"}
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="card" style={{
            padding: "40px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            borderColor: "var(--primary)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: "16px",
              right: "-28px",
              background: "var(--gradient-primary)",
              color: "white",
              fontSize: "0.7rem",
              fontWeight: 700,
              padding: "4px 32px",
              transform: "rotate(45deg)",
              letterSpacing: "0.05em",
            }}>SAVE 17%</div>

            <div style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "var(--primary-light)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "12px",
            }}>Yearly</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
              <span style={{ fontSize: "3rem", fontWeight: 800, color: "var(--foreground)" }}>£99.99</span>
              <span style={{ color: "var(--text-muted)", fontSize: "1rem" }}>/year</span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "28px" }}>
              Save £19.89 compared to monthly
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginBottom: "28px", textAlign: "left" }}>
              {[
                "Everything in monthly plan",
                "2 months free",
                "Priority draw entry",
                "Increased charity impact",
              ].map((feature, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: "var(--success)", fontSize: "0.9rem" }}>✓</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSubscribe("yearly")}
              className="btn-primary"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                opacity: loading === "yearly" ? 0.7 : 1,
              }}
            >
              {loading === "yearly" ? "Redirecting..." : "Subscribe Yearly"}
            </button>
          </div>
        </div>

        {/* What's Included */}
        <div className="card" style={{
          padding: "40px",
          textAlign: "center",
          background: "linear-gradient(135deg, rgba(108, 92, 231, 0.06), rgba(0, 206, 201, 0.04))",
        }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "12px" }}>What Happens When You Subscribe?</h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
            marginTop: "24px",
          }}>
            {[
              { icon: "⛳", title: "Enter Scores", desc: "Track your latest 5 Stableford scores" },
              { icon: "🎰", title: "Monthly Draws", desc: "Your scores become your lottery numbers" },
              { icon: "❤️", title: "Support Charity", desc: "Min 10% of subscription goes to your charity" },
              { icon: "🏆", title: "Win Prizes", desc: "Match 3, 4, or 5 numbers to win" },
            ].map((item, i) => (
              <div key={i} style={{ padding: "16px" }}>
                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{item.icon}</div>
                <div style={{ fontWeight: 600, marginBottom: "4px", fontSize: "0.95rem" }}>{item.title}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Responsive */}
        <style jsx>{`
          @media (max-width: 640px) {
            .subscribe-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
