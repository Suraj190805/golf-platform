"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

export default function CharitiesPage() {
  const [charities, setCharities] = useState([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCharities()
  }, [search, category])

  const loadCharities = async () => {
    let query = supabase.from("charities").select("*").order("name")
    if (search) query = query.ilike("name", `%${search}%`)
    if (category) query = query.eq("category", category)

    const { data } = await query
    setCharities(data || [])
    setLoading(false)
  }

  const categories = ["Youth & Sports", "Environment", "Health & Wellness", "Education", "Veterans"]

  return (
    <div style={{ padding: "32px 0", minHeight: "calc(100vh - 72px)" }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span className="badge badge-success" style={{ marginBottom: "12px" }}>Our Partners</span>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 700, marginTop: "12px" }}>
            Charity <span className="gradient-text">Directory</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "12px", maxWidth: "500px", margin: "12px auto 0" }}>
            Browse the charities making a real impact. Choose one you believe in and support it every time you play.
          </p>
        </div>

        {/* Search & Filter */}
        <div style={{
          display: "flex",
          gap: "12px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}>
          <input
            className="input"
            type="text"
            placeholder="Search charities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: "1", minWidth: "200px" }}
          />
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: "auto", minWidth: "180px" }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Charity Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            Loading charities...
          </div>
        ) : charities.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            No charities found. Try adjusting your search.
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px",
          }}>
            {charities.map(charity => (
              <Link
                key={charity.id}
                href={`/charities/${charity.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  {/* Charity Image / Placeholder */}
                  <div style={{
                    height: "160px",
                    borderRadius: "var(--radius)",
                    background: "linear-gradient(135deg, rgba(108, 92, 231, 0.12), rgba(0, 206, 201, 0.08))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "20px",
                    fontSize: "3rem",
                  }}>
                    ❤️
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: 600 }}>{charity.name}</h3>
                      {charity.is_featured && (
                        <span className="badge badge-warning" style={{ fontSize: "0.65rem", flexShrink: 0 }}>Featured</span>
                      )}
                    </div>
                    <span className="badge badge-primary" style={{ marginBottom: "12px" }}>{charity.category}</span>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6, marginTop: "8px" }}>
                      {charity.description}
                    </p>
                  </div>

                  <div style={{
                    marginTop: "20px",
                    paddingTop: "16px",
                    borderTop: "1px solid var(--surface-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <span style={{ color: "var(--primary-light)", fontSize: "0.85rem", fontWeight: 500 }}>
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
