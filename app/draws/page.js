"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function DrawsPage() {
  const [draws, setDraws] = useState([])
  const [userResults, setUserResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      // Load published draws
      const { data: drawsData } = await supabase
        .from("draws")
        .select("*")
        .eq("status", "published")
        .order("draw_date", { ascending: false })
      setDraws(drawsData || [])

      // Load user's own results if logged in
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser(authUser)
        const { data: resultsData } = await supabase
          .from("draw_results")
          .select("*, draws(draw_month, winning_numbers, draw_date)")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false })
        setUserResults(resultsData || [])
      }

      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-muted)" }}>Loading draws...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: "32px 0", minHeight: "calc(100vh - 72px)" }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span className="badge badge-primary" style={{ marginBottom: "12px" }}>Monthly Draws</span>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 700, marginTop: "12px" }}>
            Draw <span className="gradient-text">Results</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "12px", maxWidth: "500px", margin: "12px auto 0" }}>
            Check the latest draw results. Match 3, 4, or 5 numbers from your scores to win prizes.
          </p>
        </div>

        {/* Your Results */}
        {user && userResults.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "20px" }}>🏆 Your Results</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {userResults.map((r, i) => (
                <div key={i} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>{r.draws?.draw_month || "Draw"}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      Your scores: {(r.user_scores || []).join(", ")} · Matched: {r.matched_count}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: parseFloat(r.prize_amount) > 0 ? "var(--success)" : "var(--text-muted)" }}>
                      £{parseFloat(r.prize_amount).toFixed(2)}
                    </div>
                    <span className={`badge ${r.matched_count >= 3 ? "badge-success" : "badge-warning"}`} style={{ fontSize: "0.7rem" }}>
                      {r.matched_count}-match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Published Draws */}
        <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "20px" }}>🎰 All Published Draws</h2>
        {draws.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎰</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "8px" }}>No Draws Yet</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              The first draw will be published at the start of next month. Make sure you have 5 scores entered!
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {draws.map((d) => (
              <div key={d.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "12px" }}>{d.draw_month}</div>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                      {(d.winning_numbers || []).map((n, i) => (
                        <span key={i} style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: "44px", height: "44px", borderRadius: "12px",
                          background: "rgba(108, 92, 231, 0.15)", fontWeight: 700, fontSize: "1.1rem", color: "var(--primary-light)",
                        }}>{n}</span>
                      ))}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      Draw date: {d.draw_date} · Type: {d.draw_type}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent)" }}>
                      £{parseFloat(d.prize_pool_total).toFixed(2)}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Prize Pool</div>
                    {parseFloat(d.jackpot_rollover) > 0 && (
                      <div style={{ color: "var(--warning)", fontSize: "0.8rem", marginTop: "4px" }}>
                        +£{parseFloat(d.jackpot_rollover).toFixed(2)} rollover
                      </div>
                    )}
                  </div>
                </div>

                {/* Prize Tier Info */}
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px",
                  marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--surface-border)",
                }}>
                  {[
                    { match: "5-Match", pct: "40%", color: "var(--accent)" },
                    { match: "4-Match", pct: "35%", color: "var(--primary-light)" },
                    { match: "3-Match", pct: "25%", color: "var(--success)" },
                  ].map((tier, i) => (
                    <div key={i} style={{ textAlign: "center", padding: "12px", background: "var(--surface)", borderRadius: "var(--radius)" }}>
                      <div style={{ fontWeight: 700, color: tier.color, fontSize: "0.95rem" }}>{tier.match}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{tier.pct} of pool</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
