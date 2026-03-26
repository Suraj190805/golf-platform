"use client"

import { Suspense, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [scores, setScores] = useState([])
  const [charities, setCharities] = useState([])
  const [drawResults, setDrawResults] = useState([])
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)

  // Score form state
  const [newScore, setNewScore] = useState("")
  const [newDate, setNewDate] = useState("")
  const [scoreLoading, setScoreLoading] = useState(false)
  const [scoreError, setScoreError] = useState("")
  const [scoreSuccess, setScoreSuccess] = useState("")

  // Edit score state
  const [editingId, setEditingId] = useState(null)
  const [editScore, setEditScore] = useState("")
  const [editDate, setEditDate] = useState("")

  // Charity update state
  const [charityLoading, setCharityLoading] = useState(false)
  const [contributionPct, setContributionPct] = useState(10)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push("/auth/login")
        return
      }
      setUser(authUser)

      // If redirected from Stripe checkout, verify and activate subscription
      const sessionId = searchParams.get("session_id")
      if (sessionId && searchParams.get("subscription") === "success") {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          await fetch("/api/stripe/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ session_id: sessionId }),
          })
          // Clean up URL
          router.replace("/dashboard")
        } catch (err) {
          console.error("Subscription verification failed:", err)
        }
      }

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single()
      setProfile(profileData)
      if (profileData?.charity_contribution_pct) {
        setContributionPct(profileData.charity_contribution_pct)
      }

      // Load scores
      const { data: scoresData } = await supabase
        .from("scores")
        .select("*")
        .eq("user_id", authUser.id)
        .order("played_date", { ascending: false })
        .limit(5)
      setScores(scoresData || [])

      // Load charities
      const { data: charitiesData } = await supabase
        .from("charities")
        .select("*")
        .order("name")
      setCharities(charitiesData || [])

      // Load draw results
      const { data: resultsData } = await supabase
        .from("draw_results")
        .select("*, draws(*)")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
      setDrawResults(resultsData || [])

      // Load donations
      const donationsRes = await fetch(`/api/donations?user_id=${authUser.id}`)
      if (donationsRes.ok) {
        const donationsData = await donationsRes.json()
        setDonations(donationsData || [])
      }

      setLoading(false)
    }
    loadData()
  }, [router])

  // Add new score
  const handleAddScore = async (e) => {
    e.preventDefault()
    setScoreError("")
    setScoreSuccess("")
    setScoreLoading(true)

    const scoreVal = parseInt(newScore)
    if (!scoreVal || scoreVal < 1 || scoreVal > 45) {
      setScoreError("Score must be between 1 and 45")
      setScoreLoading(false)
      return
    }
    if (!newDate) {
      setScoreError("Date is required")
      setScoreLoading(false)
      return
    }

    // If already 5 scores, delete oldest
    if (scores.length >= 5) {
      const oldest = scores[scores.length - 1]
      await supabase.from("scores").delete().eq("id", oldest.id)
    }

    const { data, error } = await supabase
      .from("scores")
      .insert([{ user_id: user.id, score: scoreVal, played_date: newDate }])
      .select()
      .single()

    if (error) {
      setScoreError(error.message)
    } else {
      const updated = [data, ...scores.slice(0, 4)]
      setScores(updated)
      setNewScore("")
      setNewDate("")
      setScoreSuccess("Score added successfully!")
      setTimeout(() => setScoreSuccess(""), 3000)
    }
    setScoreLoading(false)
  }

  // Update score
  const handleUpdateScore = async (id) => {
    const scoreVal = parseInt(editScore)
    if (scoreVal < 1 || scoreVal > 45) return

    const { data, error } = await supabase
      .from("scores")
      .update({ score: scoreVal, played_date: editDate })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (!error && data) {
      setScores(scores.map(s => s.id === id ? data : s))
    }
    setEditingId(null)
  }

  // Update charity selection
  const handleCharitySelect = async (charityId) => {
    setCharityLoading(true)
    await supabase
      .from("profiles")
      .update({ selected_charity_id: charityId })
      .eq("id", user.id)
    setProfile(prev => ({ ...prev, selected_charity_id: charityId }))
    setCharityLoading(false)
  }

  // Update contribution percentage
  const handleContributionUpdate = async () => {
    if (contributionPct < 10 || contributionPct > 100) return
    await supabase
      .from("profiles")
      .update({ charity_contribution_pct: contributionPct })
      .eq("id", user.id)
    setProfile(prev => ({ ...prev, charity_contribution_pct: contributionPct }))
  }

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "calc(100vh - 72px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Loading dashboard...</div>
      </div>
    )
  }

  const selectedCharity = charities.find(c => c.id === profile?.selected_charity_id)
  const totalWinnings = drawResults.reduce((sum, r) => sum + (parseFloat(r.prize_amount) || 0), 0)

  return (
    <div style={{ padding: "32px 0", minHeight: "calc(100vh - 72px)" }}>
      <div className="container">
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "36px",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700 }}>
              Welcome back, <span className="gradient-text">{profile?.full_name || user?.email}</span>
            </h1>
            <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
              Manage your scores, charity, and draw participation
            </p>
          </div>
          {profile?.is_admin && (
            <Link href="/admin" className="btn-secondary" style={{ padding: "10px 20px", fontSize: "0.85rem" }}>
              Admin Panel →
            </Link>
          )}
        </div>

        {/* Dashboard Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "24px",
        }}>

          {/* ===== 1. SUBSCRIPTION STATUS ===== */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>💳 Subscription</h2>
              <span className={`badge ${profile?.subscription_status === "active" ? "badge-success" : "badge-error"}`}>
                {profile?.subscription_status || "inactive"}
              </span>
            </div>
            {profile?.subscription_status === "active" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Plan</span>
                  <span style={{ fontWeight: 500, fontSize: "0.9rem", textTransform: "capitalize" }}>{profile?.subscription_plan || "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Renewal Date</span>
                  <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{profile?.subscription_end || "—"}</span>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "16px" }}>
                  Subscribe to access draws and compete for prizes.
                </p>
                <Link href="/subscribe" className="btn-primary" style={{ width: "100%", padding: "12px", fontSize: "0.9rem" }}>
                  Subscribe Now
                </Link>
              </div>
            )}
          </div>

          {/* ===== 2. SCORE ENTRY & EDIT ===== */}
          <div className="card" style={{ gridColumn: "span 1" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "20px" }}>⛳ Your Scores</h2>
            
            {/* Add Score Form */}
            <form onSubmit={handleAddScore} style={{
              display: "flex",
              gap: "8px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}>
              <input
                className="input"
                type="number"
                min="1"
                max="45"
                placeholder="Score (1-45)"
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                style={{ flex: "1", minWidth: "100px" }}
                required
              />
              <input
                className="input"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                style={{ flex: "1", minWidth: "140px" }}
                required
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={scoreLoading}
                style={{ padding: "12px 20px", fontSize: "0.85rem", whiteSpace: "nowrap" }}
              >
                {scoreLoading ? "..." : "+ Add"}
              </button>
            </form>

            {scoreError && <p style={{ color: "var(--error)", fontSize: "0.8rem", marginBottom: "8px" }}>{scoreError}</p>}
            {scoreSuccess && <p style={{ color: "var(--success)", fontSize: "0.8rem", marginBottom: "8px" }}>{scoreSuccess}</p>}

            {/* Score List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {scores.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "20px 0" }}>
                  No scores yet. Enter your first round!
                </p>
              ) : scores.map((s, i) => (
                <div key={s.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "var(--surface)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--surface-border)",
                }}>
                  {editingId === s.id ? (
                    <div style={{ display: "flex", gap: "8px", flex: 1, flexWrap: "wrap" }}>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        max="45"
                        value={editScore}
                        onChange={(e) => setEditScore(e.target.value)}
                        style={{ width: "80px", padding: "8px" }}
                      />
                      <input
                        className="input"
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        style={{ width: "140px", padding: "8px" }}
                      />
                      <button onClick={() => handleUpdateScore(s.id)} style={{ background: "none", border: "none", color: "var(--success)", cursor: "pointer", fontWeight: 600 }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: "rgba(108, 92, 231, 0.12)",
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: "var(--primary-light)",
                        }}>
                          {s.score}
                        </span>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{s.played_date}</span>
                      </div>
                      <button
                        onClick={() => { setEditingId(s.id); setEditScore(s.score.toString()); setEditDate(s.played_date); }}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              ))}
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", textAlign: "center", marginTop: "4px" }}>
                {scores.length}/5 scores · Newest replaces oldest
              </p>
            </div>
          </div>

          {/* ===== 3. CHARITY SELECTION ===== */}
          <div className="card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "20px" }}>❤️ Your Charity</h2>
            
            {selectedCharity ? (
              <div style={{
                padding: "16px",
                background: "rgba(0, 184, 148, 0.06)",
                borderRadius: "var(--radius)",
                border: "1px solid rgba(0, 184, 148, 0.15)",
                marginBottom: "16px",
              }}>
                <div style={{ fontWeight: 600, marginBottom: "4px" }}>{selectedCharity.name}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{selectedCharity.category}</div>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "16px" }}>
                No charity selected yet. Choose one below:
              </p>
            )}

            {/* Charity Selector */}
            <select
              className="input"
              value={profile?.selected_charity_id || ""}
              onChange={(e) => handleCharitySelect(e.target.value)}
              disabled={charityLoading}
              style={{ marginBottom: "16px" }}
            >
              <option value="">Select a charity...</option>
              {charities.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.category}</option>
              ))}
            </select>

            {/* Contribution % */}
            <div>
              <label className="input-label">Contribution ({contributionPct}%)</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={contributionPct}
                  onChange={(e) => setContributionPct(parseInt(e.target.value))}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={handleContributionUpdate}
                  style={{
                    background: "none",
                    border: "1px solid var(--surface-border)",
                    color: "var(--primary-light)",
                    padding: "6px 12px",
                    borderRadius: "var(--radius)",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                  }}
                >
                  Save
                </button>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>
                Minimum 10% of your subscription goes to your chosen charity
              </p>
            </div>
          </div>

          {/* ===== 4. PARTICIPATION SUMMARY ===== */}
          <div className="card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "20px" }}>🎰 Draw Participation</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "16px",
                background: "var(--surface)",
                borderRadius: "var(--radius)",
              }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Draws Entered</span>
                <span style={{ fontWeight: 700, color: "var(--primary-light)", fontSize: "1.2rem" }}>
                  {drawResults.length}
                </span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "16px",
                background: "var(--surface)",
                borderRadius: "var(--radius)",
              }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Your Numbers</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {scores.length > 0 ? scores.map((s, i) => (
                    <span key={i} style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: "rgba(108, 92, 231, 0.15)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--primary-light)",
                    }}>{s.score}</span>
                  )) : <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Enter scores first</span>}
                </div>
              </div>
              <div style={{
                padding: "16px",
                background: "rgba(108, 92, 231, 0.06)",
                borderRadius: "var(--radius)",
                border: "1px solid rgba(108, 92, 231, 0.12)",
                textAlign: "center",
              }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  Next draw: <strong>1st of next month</strong>
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>
                  Make sure you have 5 scores entered to participate
                </p>
              </div>
            </div>
          </div>

          {/* ===== 5. WINNINGS OVERVIEW ===== */}
          <div className="card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "20px" }}>🏆 Winnings</h2>
            <div style={{
              textAlign: "center",
              padding: "24px",
              background: "linear-gradient(135deg, rgba(108, 92, 231, 0.08), rgba(0, 206, 201, 0.05))",
              borderRadius: "var(--radius)",
              marginBottom: "16px",
            }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)" }}>
                £{totalWinnings.toFixed(2)}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>Total Winnings</div>
            </div>

            {drawResults.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {drawResults.slice(0, 5).map((r, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "var(--surface)",
                    borderRadius: "var(--radius)",
                    fontSize: "0.85rem",
                  }}>
                    <span style={{ color: "var(--text-muted)" }}>
                      {r.matched_count}-match · {r.draws?.draw_month}
                    </span>
                    <span style={{ fontWeight: 600, color: parseFloat(r.prize_amount) > 0 ? "var(--success)" : "var(--text-muted)" }}>
                      £{parseFloat(r.prize_amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center" }}>
                No draw results yet. Enter your scores and wait for the monthly draw!
              </p>
            )}
          </div>

          {/* ===== 6. DONATIONS ===== */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>💝 Donations</h2>
              <Link href="/donate" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
                + Donate
              </Link>
            </div>
            <div style={{
              textAlign: "center",
              padding: "20px",
              background: "linear-gradient(135deg, rgba(0, 206, 201, 0.06), rgba(0, 184, 148, 0.04))",
              borderRadius: "var(--radius)",
              marginBottom: "16px",
            }}>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent)" }}>
                £{donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0).toFixed(2)}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>Total Donated</div>
            </div>

            {donations.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {donations.slice(0, 5).map((d, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "var(--surface)",
                    borderRadius: "var(--radius)",
                    fontSize: "0.85rem",
                  }}>
                    <div>
                      <span style={{ fontWeight: 500 }}>{d.charities?.name || "Charity"}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginLeft: "8px" }}>
                        {new Date(d.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span style={{ fontWeight: 600, color: "var(--success)" }}>
                      £{parseFloat(d.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "12px" }}>
                  No donations yet. Make a difference today!
                </p>
                <Link href="/donate" className="btn-primary" style={{ padding: "10px 24px", fontSize: "0.85rem" }}>
                  Make a Donation
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Loading dashboard...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}