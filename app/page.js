"use client"

import Link from "next/link"

export default function Home() {
  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section style={{
        minHeight: "calc(100vh - 72px)",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background glow effects */}
        <div style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(108, 92, 231, 0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          bottom: "-20%",
          left: "-10%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(0, 206, 201, 0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }} />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            maxWidth: "720px",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
          }}>
            <div className="animate-fade-in-up" style={{ opacity: 0 }}>
              <span className="badge badge-primary" style={{ fontSize: "0.8rem" }}>
                🏌️ A new way to play & give
              </span>
            </div>
            <h1 className="animate-fade-in-up delay-100" style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              opacity: 0,
            }}>
              Play Golf.{" "}
              <span className="gradient-text">Win Prizes.</span>
              <br />
              Make a Difference.
            </h1>
            <p className="animate-fade-in-up delay-200" style={{
              fontSize: "1.2rem",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              maxWidth: "560px",
              opacity: 0,
            }}>
              Subscribe, enter your scores, and compete in monthly prize draws — 
              while a portion of your subscription goes directly to a charity you choose.
            </p>
            <div className="animate-fade-in-up delay-300" style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              opacity: 0,
            }}>
              <Link href="/auth/signup" className="btn-primary" style={{ fontSize: "1.05rem", padding: "16px 36px" }}>
                Subscribe Now →
              </Link>
              <Link href="/#how-it-works" className="btn-secondary" style={{ fontSize: "1.05rem", padding: "16px 36px" }}>
                Learn More
              </Link>
            </div>

            {/* Stats bar */}
            <div className="animate-fade-in-up delay-400" style={{
              display: "flex",
              gap: "40px",
              paddingTop: "20px",
              flexWrap: "wrap",
              opacity: 0,
            }}>
              {[
                { value: "£10K+", label: "Prize Pool" },
                { value: "5", label: "Charities" },
                { value: "Monthly", label: "Draws" },
              ].map((stat, i) => (
                <div key={i}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary-light)" }}>{stat.value}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="section" style={{ background: "var(--surface)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <span className="badge badge-primary" style={{ marginBottom: "16px" }}>How It Works</span>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 700, marginTop: "12px" }}>
              Simple. Engaging. <span className="gradient-text">Impactful.</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "12px", fontSize: "1.05rem", maxWidth: "500px", margin: "12px auto 0" }}>
              Three easy steps to start making a difference every time you play.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}>
            {[
              {
                step: "01",
                icon: "💳",
                title: "Subscribe",
                desc: "Choose a monthly or yearly plan. A portion goes to your chosen charity automatically.",
              },
              {
                step: "02",
                icon: "⛳",
                title: "Enter Your Scores",
                desc: "Submit your latest 5 Stableford scores. The platform keeps your most recent rounds.",
              },
              {
                step: "03",
                icon: "🎰",
                title: "Win in Monthly Draws",
                desc: "Your scores become your lottery numbers. Match 3, 4, or 5 numbers to win from the prize pool.",
              },
            ].map((item, i) => (
              <div key={i} className="card" style={{ textAlign: "center", padding: "40px 28px" }}>
                <div style={{
                  fontSize: "2.5rem",
                  marginBottom: "16px",
                }}>{item.icon}</div>
                <div style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--primary-light)",
                  letterSpacing: "0.1em",
                  marginBottom: "8px",
                }}>STEP {item.step}</div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "10px" }}>{item.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DRAWS / PRIZE SECTION ===== */}
      <section id="draws" className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <span className="badge badge-success" style={{ marginBottom: "16px" }}>Prize Draws</span>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 700, marginTop: "12px" }}>
              Your Scores. <span className="gradient-text">Your Lottery.</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "12px", fontSize: "1.05rem", maxWidth: "520px", margin: "12px auto 0" }}>
              Every month, a draw takes place. Match your scores to the winning numbers and claim your prize.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}>
            {[
              { match: "5-Number Match", pool: "40%", rollover: true, color: "var(--primary-light)", label: "JACKPOT" },
              { match: "4-Number Match", pool: "35%", rollover: false, color: "var(--accent)", label: "SECOND TIER" },
              { match: "3-Number Match", pool: "25%", rollover: false, color: "var(--accent-light)", label: "THIRD TIER" },
            ].map((tier, i) => (
              <div key={i} className="card" style={{
                textAlign: "center",
                padding: "40px 28px",
                borderTop: `3px solid ${tier.color}`,
              }}>
                <div style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: tier.color,
                  marginBottom: "12px",
                }}>{tier.label}</div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px" }}>{tier.match}</h3>
                <div style={{
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  color: tier.color,
                  marginBottom: "8px",
                }}>{tier.pool}</div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>of prize pool</p>
                {tier.rollover && (
                  <div className="badge badge-warning" style={{ marginTop: "16px" }}>
                    Jackpot Rollover
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CHARITY IMPACT ===== */}
      <section className="section" style={{ background: "var(--surface)" }}>
        <div className="container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "60px",
            alignItems: "center",
          }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: "16px" }}>Charity Impact</span>
              <h2 style={{ fontSize: "2.2rem", fontWeight: 700, marginTop: "12px", lineHeight: 1.2 }}>
                Every Subscription <br />
                <span className="gradient-text">Supports a Cause</span>
              </h2>
              <p style={{ color: "var(--text-secondary)", marginTop: "16px", fontSize: "1.05rem", lineHeight: 1.7 }}>
                At signup, choose a charity you believe in. A minimum of 10% of your subscription 
                goes directly to that cause — and you can increase your contribution at any time.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "28px" }}>
                {[
                  "Choose your charity at signup",
                  "Minimum 10% of subscription donated",
                  "Increase your contribution anytime",
                  "Make independent donations too",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "rgba(0, 184, 148, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      color: "var(--success)",
                      flexShrink: 0,
                    }}>✓</div>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/charities" className="btn-primary" style={{ marginTop: "32px", display: "inline-flex" }}>
                Explore Charities →
              </Link>
            </div>
            <div className="card" style={{
              padding: "40px",
              textAlign: "center",
              background: "linear-gradient(145deg, rgba(108, 92, 231, 0.08), rgba(0, 206, 201, 0.05))",
            }}>
              <div style={{ fontSize: "4rem", marginBottom: "20px" }}>❤️</div>
              <h3 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "12px" }}>5 Partner Charities</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                From youth sports access to veteran rehabilitation — choose a cause close to your heart 
                and know your subscription is making a real impact.
              </p>
              <div style={{
                display: "flex",
                justifyContent: "center",
                gap: "24px",
                marginTop: "28px",
                flexWrap: "wrap",
              }}>
                {["Youth & Sports", "Environment", "Health", "Education", "Veterans"].map((cat, i) => (
                  <span key={i} className="badge badge-primary">{cat}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="section" style={{ textAlign: "center" }}>
        <div className="container">
          <div style={{
            background: "linear-gradient(135deg, rgba(108, 92, 231, 0.12) 0%, rgba(0, 206, 201, 0.08) 100%)",
            border: "1px solid var(--surface-border)",
            borderRadius: "var(--radius-lg)",
            padding: "80px 40px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: "-50%",
              right: "-20%",
              width: "400px",
              height: "400px",
              background: "radial-gradient(circle, rgba(108, 92, 231, 0.1) 0%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none",
            }} />
            <h2 style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              marginBottom: "16px",
              position: "relative",
            }}>
              Ready to <span className="gradient-text">Tee Off</span> for Good?
            </h2>
            <p style={{
              color: "var(--text-secondary)",
              fontSize: "1.1rem",
              maxWidth: "500px",
              margin: "0 auto 32px",
              position: "relative",
            }}>
              Join the platform where golf meets generosity. Subscribe today and 
              start competing in our monthly prize draws.
            </p>
            <Link href="/auth/signup" className="btn-primary" style={{
              fontSize: "1.1rem",
              padding: "18px 48px",
              position: "relative",
            }}>
              Subscribe Now →
            </Link>
          </div>
        </div>
      </section>

      {/* Responsive grid fix for charity section */}
      <style jsx>{`
        @media (max-width: 768px) {
          section > div > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </>
  )
}
