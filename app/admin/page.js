"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({})

  // Data states
  const [users, setUsers] = useState([])
  const [draws, setDraws] = useState([])
  const [charities, setCharities] = useState([])
  const [verifications, setVerifications] = useState([])

  // Form states
  const [drawType, setDrawType] = useState("random")
  const [charityForm, setCharityForm] = useState({ name: "", description: "", category: "", is_featured: false })
  const [editingUser, setEditingUser] = useState(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth/login"); return }

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      if (!p?.is_admin) { router.push("/dashboard"); return }
      setProfile(p)

      await loadAllData()
      setLoading(false)
    }
    init()
  }, [router])

  const loadAllData = async () => {
    const [usersRes, drawsRes, charitiesRes, verificationsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("draws").select("*").order("draw_date", { ascending: false }),
      supabase.from("charities").select("*").order("name"),
      supabase.from("winner_verifications").select("*, profiles(full_name, email), draw_results(matched_count, prize_amount)").order("created_at", { ascending: false }),
    ])

    setUsers(usersRes.data || [])
    setDraws(drawsRes.data || [])
    setCharities(charitiesRes.data || [])
    setVerifications(verificationsRes.data || [])

    const activeUsers = (usersRes.data || []).filter(u => u.subscription_status === "active").length
    const totalPool = (drawsRes.data || []).reduce((sum, d) => sum + (parseFloat(d.prize_pool_total) || 0), 0)
    const totalCharity = activeUsers * 29.99 * 0.1 // estimated

    setStats({
      totalUsers: usersRes.data?.length || 0,
      activeUsers,
      totalDraws: drawsRes.data?.length || 0,
      totalPool: totalPool.toFixed(2),
      totalCharities: charitiesRes.data?.length || 0,
      charityContributions: totalCharity.toFixed(2),
      pendingVerifications: (verificationsRes.data || []).filter(v => v.status === "pending").length,
    })
  }

  // Run Draw
  const handleRunDraw = async (simulate = false) => {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch("/api/draws", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ draw_type: drawType, simulate }),
    })
    const data = await res.json()
    if (data.draw) {
      await loadAllData()
      alert(`Draw ${simulate ? "simulated" : "created"}! Winning numbers: ${data.summary.winning_numbers.join(", ")}`)
    } else {
      alert(data.error || "Error running draw")
    }
  }

  // Publish Draw
  const handlePublishDraw = async (drawId) => {
    const { data: { session } } = await supabase.auth.getSession()
    await fetch("/api/draws", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ draw_id: drawId }),
    })
    await loadAllData()
  }

  // Add Charity
  const handleAddCharity = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from("charities").insert([charityForm])
    if (!error) {
      setCharityForm({ name: "", description: "", category: "", is_featured: false })
      await loadAllData()
    }
  }

  // Delete Charity
  const handleDeleteCharity = async (id) => {
    if (!confirm("Delete this charity?")) return
    await supabase.from("charities").delete().eq("id", id)
    await loadAllData()
  }

  // Verify Winner
  const handleVerifyWinner = async (id, status) => {
    const { data: { session } } = await supabase.auth.getSession()
    await fetch("/api/winners", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ id, status }),
    })
    await loadAllData()
  }

  // Mark Payout
  const handleMarkPaid = async (id) => {
    const { data: { session } } = await supabase.auth.getSession()
    await fetch("/api/winners", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ id, payment_status: "paid" }),
    })
    await loadAllData()
  }

  // Update User
  const handleUpdateUser = async (userId, updates) => {
    await supabase.from("profiles").update(updates).eq("id", userId)
    setEditingUser(null)
    await loadAllData()
  }

  if (loading) {
    return (
      <div style={{ minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-muted)" }}>Loading admin panel...</div>
      </div>
    )
  }

  const tabs = [
    { id: "overview", label: "📊 Overview" },
    { id: "users", label: "👥 Users" },
    { id: "draws", label: "🎰 Draws" },
    { id: "charities", label: "❤️ Charities" },
    { id: "winners", label: "🏆 Winners" },
  ]

  return (
    <div style={{ padding: "32px 0", minHeight: "calc(100vh - 72px)" }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700 }}>Admin <span className="gradient-text">Dashboard</span></h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>Manage the platform</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "32px", overflowX: "auto", paddingBottom: "4px" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 20px",
                borderRadius: "var(--radius-full)",
                border: activeTab === tab.id ? "none" : "1px solid var(--surface-border)",
                background: activeTab === tab.id ? "var(--gradient-primary)" : "transparent",
                color: activeTab === tab.id ? "white" : "var(--text-secondary)",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "0.9rem",
                whiteSpace: "nowrap",
                transition: "all 0.3s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== OVERVIEW TAB ===== */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            {[
              { label: "Total Users", value: stats.totalUsers, color: "var(--primary-light)" },
              { label: "Active Subscribers", value: stats.activeUsers, color: "var(--success)" },
              { label: "Total Draws", value: stats.totalDraws, color: "var(--accent)" },
              { label: "Prize Pool Total", value: `£${stats.totalPool}`, color: "var(--warning)" },
              { label: "Charities", value: stats.totalCharities, color: "var(--primary-light)" },
              { label: "Charity Contributions", value: `£${stats.charityContributions}`, color: "var(--success)" },
              { label: "Pending Verifications", value: stats.pendingVerifications, color: "var(--error)" },
            ].map((stat, i) => (
              <div key={i} className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ===== USERS TAB ===== */}
        {activeTab === "users" && (
          <div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--surface-border)" }}>
                    {["Name", "Email", "Status", "Plan", "Admin", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>{u.full_name || "—"}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>{u.email}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className={`badge ${u.subscription_status === "active" ? "badge-success" : "badge-error"}`}>
                          {u.subscription_status || "inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>{u.subscription_plan || "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {u.is_admin ? <span className="badge badge-primary">Admin</span> : "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleUpdateUser(u.id, { subscription_status: u.subscription_status === "active" ? "inactive" : "active" })}
                            style={{ background: "none", border: "1px solid var(--surface-border)", color: "var(--text-secondary)", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem" }}
                          >
                            Toggle Sub
                          </button>
                          <button
                            onClick={() => handleUpdateUser(u.id, { is_admin: !u.is_admin })}
                            style={{ background: "none", border: "1px solid var(--surface-border)", color: "var(--text-secondary)", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem" }}
                          >
                            Toggle Admin
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== DRAWS TAB ===== */}
        {activeTab === "draws" && (
          <div>
            {/* Run Draw Controls */}
            <div className="card" style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "16px" }}>Run New Draw</h3>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <select className="input" value={drawType} onChange={(e) => setDrawType(e.target.value)} style={{ width: "auto" }}>
                  <option value="random">Random</option>
                  <option value="algorithmic">Algorithmic (Weighted)</option>
                </select>
                <button onClick={() => handleRunDraw(true)} className="btn-secondary" style={{ padding: "12px 20px", fontSize: "0.85rem" }}>
                  🔍 Simulate
                </button>
                <button onClick={() => handleRunDraw(false)} className="btn-primary" style={{ padding: "12px 20px", fontSize: "0.85rem" }}>
                  🎰 Run Draw
                </button>
              </div>
            </div>

            {/* Draw History */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {draws.map(d => (
                <div key={d.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>{d.draw_month}</div>
                    <div style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
                      {(d.winning_numbers || []).map((n, i) => (
                        <span key={i} style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: "32px", height: "32px", borderRadius: "8px",
                          background: "rgba(108, 92, 231, 0.15)", fontWeight: 700, fontSize: "0.85rem", color: "var(--primary-light)",
                        }}>{n}</span>
                      ))}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      Pool: £{parseFloat(d.prize_pool_total).toFixed(2)} · Type: {d.draw_type} · Rollover: £{parseFloat(d.jackpot_rollover).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className={`badge ${d.status === "published" ? "badge-success" : d.status === "simulated" ? "badge-warning" : "badge-primary"}`}>
                      {d.status}
                    </span>
                    {d.status !== "published" && (
                      <button onClick={() => handlePublishDraw(d.id)} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.8rem" }}>
                        Publish
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {draws.length === 0 && <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0" }}>No draws yet</p>}
            </div>
          </div>
        )}

        {/* ===== CHARITIES TAB ===== */}
        {activeTab === "charities" && (
          <div>
            {/* Add Charity Form */}
            <form onSubmit={handleAddCharity} className="card" style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "16px" }}>Add New Charity</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <input className="input" placeholder="Charity Name" value={charityForm.name} onChange={(e) => setCharityForm(p => ({ ...p, name: e.target.value }))} required />
                <select className="input" value={charityForm.category} onChange={(e) => setCharityForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="">Category</option>
                  {["Youth & Sports", "Environment", "Health & Wellness", "Education", "Veterans"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <textarea className="input" placeholder="Description" value={charityForm.description} onChange={(e) => setCharityForm(p => ({ ...p, description: e.target.value }))} style={{ gridColumn: "span 2", minHeight: "80px", resize: "vertical" }} />
                <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  <input type="checkbox" checked={charityForm.is_featured} onChange={(e) => setCharityForm(p => ({ ...p, is_featured: e.target.checked }))} />
                  Featured
                </label>
                <button type="submit" className="btn-primary" style={{ padding: "12px", fontSize: "0.85rem" }}>Add Charity</button>
              </div>
            </form>

            {/* Charity List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {charities.map(c => (
                <div key={c.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "2px" }}>{c.name}</div>
                    <span className="badge badge-primary" style={{ fontSize: "0.65rem" }}>{c.category}</span>
                    {c.is_featured && <span className="badge badge-warning" style={{ fontSize: "0.65rem", marginLeft: "6px" }}>Featured</span>}
                  </div>
                  <button onClick={() => handleDeleteCharity(c.id)} style={{
                    background: "rgba(225, 112, 85, 0.1)", border: "1px solid rgba(225, 112, 85, 0.3)",
                    color: "var(--error)", padding: "6px 14px", borderRadius: "var(--radius)", cursor: "pointer", fontSize: "0.8rem",
                  }}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== WINNERS TAB ===== */}
        {activeTab === "winners" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {verifications.length === 0 && <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0" }}>No winner verifications yet</p>}
            {verifications.map(v => (
              <div key={v.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>{v.profiles?.full_name || v.profiles?.email || "Unknown"}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "8px" }}>
                      {v.draw_results?.matched_count}-match · Prize: £{parseFloat(v.draw_results?.prize_amount || 0).toFixed(2)}
                    </div>
                    {v.proof_image_url && (
                      <a href={v.proof_image_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary-light)", fontSize: "0.85rem" }}>
                        View Proof →
                      </a>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <span className={`badge ${v.status === "approved" ? "badge-success" : v.status === "rejected" ? "badge-error" : "badge-warning"}`}>
                        {v.status}
                      </span>
                      <span className={`badge ${v.payment_status === "paid" ? "badge-success" : "badge-warning"}`}>
                        {v.payment_status}
                      </span>
                    </div>
                    {v.status === "pending" && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => handleVerifyWinner(v.id, "approved")} style={{
                          background: "rgba(0, 184, 148, 0.1)", border: "1px solid rgba(0, 184, 148, 0.3)",
                          color: "var(--success)", padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem",
                        }}>Approve</button>
                        <button onClick={() => handleVerifyWinner(v.id, "rejected")} style={{
                          background: "rgba(225, 112, 85, 0.1)", border: "1px solid rgba(225, 112, 85, 0.3)",
                          color: "var(--error)", padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem",
                        }}>Reject</button>
                      </div>
                    )}
                    {v.status === "approved" && v.payment_status === "pending" && (
                      <button onClick={() => handleMarkPaid(v.id)} style={{
                        background: "rgba(0, 184, 148, 0.1)", border: "1px solid rgba(0, 184, 148, 0.3)",
                        color: "var(--success)", padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem",
                      }}>Mark Paid</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
