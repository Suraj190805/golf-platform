"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/")
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass" : "bg-transparent"
      }`}
      style={{ padding: scrolled ? "12px 0" : "20px 0" }}
    >
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "1rem",
              color: "white",
            }}
          >
            G
          </div>
          <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--foreground)" }}>
            Golf<span style={{ color: "var(--primary-light)" }}>Charity</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div
          className="nav-links"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "32px",
          }}
        >
          <Link href="/charities" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, transition: "color 0.3s" }}>
            Charities
          </Link>
          <Link href="/#how-it-works" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, transition: "color 0.3s" }}>
            How It Works
          </Link>
          <Link href="/draws" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, transition: "color 0.3s" }}>
            Draws
          </Link>
          <Link href="/donate" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600, transition: "color 0.3s" }}>
            Donate
          </Link>

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Link href="/dashboard" className="btn-secondary" style={{ padding: "10px 24px", fontSize: "0.875rem" }}>
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Link href="/auth/login" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                Login
              </Link>
              <Link href="/auth/signup" className="btn-primary" style={{ padding: "10px 24px", fontSize: "0.875rem" }}>
                Subscribe Now
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            color: "var(--foreground)",
            fontSize: "1.5rem",
            cursor: "pointer",
          }}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="glass"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <Link href="/charities" onClick={() => setMenuOpen(false)} style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "1rem", fontWeight: 500 }}>Charities</Link>
          <Link href="/#how-it-works" onClick={() => setMenuOpen(false)} style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "1rem", fontWeight: 500 }}>How It Works</Link>
          <Link href="/draws" onClick={() => setMenuOpen(false)} style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "1rem", fontWeight: 500 }}>Draws</Link>
          <Link href="/donate" onClick={() => setMenuOpen(false)} style={{ color: "var(--accent)", textDecoration: "none", fontSize: "1rem", fontWeight: 600 }}>Donate</Link>
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="btn-secondary" style={{ textAlign: "center" }}>Dashboard</Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem", textAlign: "left" }}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Login</Link>
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="btn-primary" style={{ textAlign: "center" }}>Subscribe Now</Link>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .mobile-menu-toggle { display: block !important; }
        }
      `}</style>
    </nav>
  )
}
