import Link from "next/link"

export default function Footer() {
  return (
    <footer style={{
      background: "var(--surface)",
      borderTop: "1px solid var(--surface-border)",
      padding: "60px 0 32px",
    }}>
      <div className="container">
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "40px",
          marginBottom: "48px",
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                background: "var(--gradient-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "0.875rem",
                color: "white",
              }}>G</div>
              <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--foreground)" }}>
                Golf<span style={{ color: "var(--primary-light)" }}>Charity</span>
              </span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.7 }}>
              Play golf. Win prizes. Make a difference. A subscription platform where every round supports a cause you believe in.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 style={{ color: "var(--foreground)", fontWeight: 600, marginBottom: "16px", fontSize: "0.9rem" }}>Platform</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link href="/#how-it-works" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.875rem", transition: "color 0.3s" }}>How It Works</Link>
              <Link href="/charities" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.875rem", transition: "color 0.3s" }}>Charities</Link>
              <Link href="/#draws" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.875rem", transition: "color 0.3s" }}>Prize Draws</Link>
              <Link href="/auth/signup" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.875rem", transition: "color 0.3s" }}>Subscribe</Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 style={{ color: "var(--foreground)", fontWeight: 600, marginBottom: "16px", fontSize: "0.9rem" }}>Support</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link href="/#faq" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.875rem" }}>FAQ</Link>
              <Link href="/auth/login" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.875rem" }}>Login</Link>
              <Link href="/dashboard" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.875rem" }}>Dashboard</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ color: "var(--foreground)", fontWeight: 600, marginBottom: "16px", fontSize: "0.9rem" }}>Legal</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Privacy Policy</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Terms of Service</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Cookie Policy</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          borderTop: "1px solid var(--surface-border)",
          paddingTop: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            © 2026 GolfCharity Platform. All rights reserved.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            Built with ❤️ for charity
          </p>
        </div>
      </div>
    </footer>
  )
}
