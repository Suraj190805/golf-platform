"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useParams } from "next/navigation"
import Link from "next/link"

export default function CharityProfile() {
  const params = useParams()
  const [charity, setCharity] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCharity = async () => {
      const { data } = await supabase
        .from("charities")
        .select("*")
        .eq("id", params.id)
        .single()
      setCharity(data)
      setLoading(false)
    }
    if (params.id) loadCharity()
  }, [params.id])

  if (loading) {
    return (
      <div style={{ minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-muted)" }}>Loading...</div>
      </div>
    )
  }

  if (!charity) {
    return (
      <div style={{ minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Charity not found</h2>
        <Link href="/charities" className="btn-secondary">← Back to Charities</Link>
      </div>
    )
  }

  const events = charity.upcoming_events || []

  return (
    <div style={{ padding: "32px 0", minHeight: "calc(100vh - 72px)" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        <Link href="/charities" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
          ← Back to Charities
        </Link>

        {/* Header Image */}
        <div style={{
          height: "240px",
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(0, 206, 201, 0.1))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "5rem",
          marginBottom: "32px",
        }}>
          ❤️
        </div>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>{charity.name}</h1>
          {charity.is_featured && <span className="badge badge-warning">Featured</span>}
        </div>
        <span className="badge badge-primary" style={{ marginBottom: "24px" }}>{charity.category}</span>

        {/* Description */}
        <div className="card" style={{ marginTop: "24px", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "12px" }}>About</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "1rem" }}>
            {charity.description}
          </p>
          {charity.website_url && (
            <a
              href={charity.website_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--primary-light)", textDecoration: "none", fontSize: "0.9rem", display: "inline-block", marginTop: "16px", fontWeight: 500 }}
            >
              Visit Website →
            </a>
          )}
        </div>

        {/* Upcoming Events */}
        {events.length > 0 && (
          <div className="card" style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "16px" }}>🗓️ Upcoming Events</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {events.map((event, i) => (
                <div key={i} style={{
                  padding: "16px",
                  background: "var(--surface)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--surface-border)",
                }}>
                  <div style={{ fontWeight: 600, marginBottom: "4px" }}>{event.name || "Event"}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{event.date || ""}</div>
                  {event.description && <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "8px" }}>{event.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="card" style={{
          textAlign: "center",
          background: "linear-gradient(135deg, rgba(108, 92, 231, 0.08), rgba(0, 206, 201, 0.05))",
          padding: "40px",
        }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "12px" }}>
            Support {charity.name}
          </h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
            Subscribe to support through gameplay, or make a direct donation.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/signup" className="btn-primary">
              Subscribe & Support →
            </Link>
            <Link href={`/donate?charity=${charity.id}`} className="btn-secondary">
              Donate Directly 💚
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
