"use client"

import { useEffect, useState, Suspense } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

const PRESET_AMOUNTS = [5, 10, 25, 50, 100]

function DonateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState(null)
  const [charities, setCharities] = useState([])
  const [selectedCharity, setSelectedCharity] = useState("")
  const [amount, setAmount] = useState("")
  const [customAmount, setCustomAmount] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [donatedCharity, setDonatedCharity] = useState(null)
  const [donatedAmount, setDonatedAmount] = useState(0)

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push("/auth/login")
        return
      }
      setUser(authUser)

      // Load charities
      const { data: charitiesData } = await supabase
        .from("charities")
        .select("*")
        .order("name")
      setCharities(charitiesData || [])

      // Pre-select charity from URL param
      const charityParam = searchParams.get("charity")
      if (charityParam) {
        setSelectedCharity(charityParam)
      } else {
        // Fall back to user's selected charity
        const { data: profile } = await supabase
          .from("profiles")
          .select("selected_charity_id")
          .eq("id", authUser.id)
          .single()
        if (profile?.selected_charity_id) {
          setSelectedCharity(profile.selected_charity_id)
        }
      }

      setPageLoading(false)
    }
    init()
  }, [router, searchParams])

  const handleDonate = async () => {
    setError("")
    const numAmount = parseFloat(amount)

    if (!selectedCharity) {
      setError("Please select a charity.")
      return
    }
    if (!numAmount || numAmount < 1) {
      setError("Minimum donation is £1.")
      return
    }
    if (numAmount > 10000) {
      setError("Maximum donation is £10,000.")
      return
    }

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch("/api/donations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          charity_id: selectedCharity,
          amount: numAmount,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || "Donation failed. Please try again.")
        setLoading(false)
        return
      }

      setDonatedCharity(charities.find(c => c.id === selectedCharity))
      setDonatedAmount(numAmount)
      setSuccess(true)
    } catch {
      setError("Unable to connect. Please try again.")
    }

    setLoading(false)
  }

  if (pageLoading) {
    return (
      <div style={{
        minHeight: "calc(100vh - 72px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Loading...</div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div style={{ padding: "32px 0", minHeight: "calc(100vh - 72px)" }}>
        <div className="container" style={{ maxWidth: "600px" }}>
          <div className="card" style={{
            textAlign: "center",
            padding: "60px 40px",
            animation: "fadeInUp 0.6s ease-out",
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(0, 184, 148, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: "2.5rem",
            }}>
              💚
            </div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "12px" }}>
              Thank You!
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", marginBottom: "8px" }}>
              Your donation of <strong style={{ color: "var(--success)" }}>£{donatedAmount.toFixed(2)}</strong> to
            </p>
            <p style={{ fontWeight: 600, fontSize: "1.15rem", marginBottom: "32px" }}>
              {donatedCharity?.name}
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "32px" }}>
              has been recorded. You're making a real difference!
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => { setSuccess(false); setAmount(""); setCustomAmount(false); }}
                className="btn-primary"
                style={{ padding: "12px 28px", fontSize: "0.9rem" }}
              >
                Donate Again
              </button>
              <Link
                href="/dashboard"
                className="btn-secondary"
                style={{ padding: "12px 28px", fontSize: "0.9rem" }}
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const charityObj = charities.find(c => c.id === selectedCharity)

  return (
    <div style={{ padding: "32px 0", minHeight: "calc(100vh - 72px)" }}>
      <div className="container" style={{ maxWidth: "640px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="badge badge-success" style={{ marginBottom: "12px" }}>Independent Donation</span>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "12px" }}>
            Make a <span className="gradient-text">Donation</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "12px", maxWidth: "440px", margin: "12px auto 0" }}>
            Support a charity directly — not tied to your subscription or gameplay.
          </p>
        </div>

        <div className="card" style={{ padding: "36px" }}>
          {/* Charity Selector */}
          <div style={{ marginBottom: "28px" }}>
            <label className="input-label">Choose a Charity</label>
            <select
              className="input"
              value={selectedCharity}
              onChange={(e) => setSelectedCharity(e.target.value)}
            >
              <option value="">Select a charity...</option>
              {charities.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.category}</option>
              ))}
            </select>
            {charityObj && (
              <div style={{
                marginTop: "12px",
                padding: "14px 16px",
                background: "rgba(0, 184, 148, 0.06)",
                borderRadius: "var(--radius)",
                border: "1px solid rgba(0, 184, 148, 0.15)",
              }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "4px" }}>{charityObj.name}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{charityObj.category}</div>
              </div>
            )}
          </div>

          {/* Amount Selection */}
          <div style={{ marginBottom: "28px" }}>
            <label className="input-label">Donation Amount (£)</label>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "8px",
              marginBottom: "12px",
            }}>
              {PRESET_AMOUNTS.map(preset => (
                <button
                  key={preset}
                  onClick={() => { setAmount(preset.toString()); setCustomAmount(false); }}
                  style={{
                    padding: "14px 8px",
                    borderRadius: "var(--radius)",
                    border: amount === preset.toString() && !customAmount
                      ? "2px solid var(--primary)"
                      : "1px solid var(--surface-border)",
                    background: amount === preset.toString() && !customAmount
                      ? "rgba(108, 92, 231, 0.12)"
                      : "var(--surface)",
                    color: amount === preset.toString() && !customAmount
                      ? "var(--primary-light)"
                      : "var(--foreground)",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "1rem",
                    fontFamily: "inherit",
                    transition: "all 0.2s ease",
                  }}
                >
                  £{preset}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <button
              onClick={() => { setCustomAmount(true); setAmount(""); }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                background: "none",
                border: "none",
                color: "var(--primary-light)",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 500,
                padding: "8px 0",
                fontFamily: "inherit",
                marginBottom: customAmount ? "8px" : "0",
              }}
            >
              {customAmount ? "Or select a preset amount above" : "Enter a custom amount"}
            </button>

            {customAmount && (
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                }}>
                  £
                </span>
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="10000"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ paddingLeft: "36px", fontSize: "1.1rem", fontWeight: 600 }}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(225, 112, 85, 0.1)",
              border: "1px solid rgba(225, 112, 85, 0.3)",
              borderRadius: "var(--radius)",
              padding: "12px 16px",
              color: "var(--error)",
              fontSize: "0.85rem",
              marginBottom: "20px",
            }}>
              {error}
            </div>
          )}

          {/* Summary & Submit */}
          {amount && selectedCharity && (
            <div style={{
              padding: "20px",
              background: "linear-gradient(135deg, rgba(108, 92, 231, 0.06), rgba(0, 206, 201, 0.04))",
              borderRadius: "var(--radius)",
              border: "1px solid rgba(108, 92, 231, 0.12)",
              marginBottom: "20px",
              textAlign: "center",
            }}>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "6px" }}>
                You are donating
              </p>
              <p style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent)" }}>
                £{parseFloat(amount || 0).toFixed(2)}
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
                to <strong>{charityObj?.name}</strong>
              </p>
            </div>
          )}

          <button
            onClick={handleDonate}
            className="btn-primary"
            disabled={loading || !amount || !selectedCharity}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "1rem",
              opacity: loading || !amount || !selectedCharity ? 0.6 : 1,
            }}
          >
            {loading ? "Processing..." : "Donate Now 💚"}
          </button>

          <p style={{
            color: "var(--text-muted)",
            fontSize: "0.75rem",
            textAlign: "center",
            marginTop: "16px",
          }}>
            This is a record of your donation intent. Actual payment processing may vary.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function DonatePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Loading...</div>
      </div>
    }>
      <DonateContent />
    </Suspense>
  )
}
