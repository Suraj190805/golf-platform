import { Resend } from "resend"

let _resend = null
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM_EMAIL = process.env.FROM_EMAIL || "GolfCharity <onboarding@resend.dev>"

// ─── Welcome Email ───────────────────────────────────────────────

export async function sendWelcomeEmail(to, name) {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Welcome to GolfCharity! 🏌️",
      html: `
        <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0f; color: #f0f0f5; padding: 40px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #6c5ce7 0%, #00cec9 100%); color: white; font-weight: 800; font-size: 1.2rem; margin-bottom: 12px;">G</div>
            <h1 style="margin: 8px 0 0; font-size: 1.6rem; font-weight: 700;">Welcome to GolfCharity</h1>
          </div>
          <p style="color: #b0b0c8; line-height: 1.7; font-size: 1rem;">Hi ${name || "there"},</p>
          <p style="color: #b0b0c8; line-height: 1.7; font-size: 1rem;">
            Thanks for joining GolfCharity! You're now part of a community that combines
            the love of golf with real charitable impact.
          </p>
          <p style="color: #b0b0c8; line-height: 1.7; font-size: 1rem;">Here's how to get started:</p>
          <ol style="color: #b0b0c8; line-height: 2; font-size: 0.95rem; padding-left: 20px;">
            <li><strong style="color: #f0f0f5;">Subscribe</strong> — choose a monthly or yearly plan</li>
            <li><strong style="color: #f0f0f5;">Pick a charity</strong> — at least 10% of your sub goes to them</li>
            <li><strong style="color: #f0f0f5;">Enter your scores</strong> — your latest 5 Stableford scores become your draw numbers</li>
            <li><strong style="color: #f0f0f5;">Win prizes</strong> — match 3, 4, or 5 numbers in the monthly draw</li>
          </ol>
          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard"
               style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6c5ce7, #00cec9); color: white; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 0.95rem;">
              Go to Dashboard →
            </a>
          </div>
          <p style="color: #8b8ba3; font-size: 0.8rem; text-align: center; margin-top: 40px;">
            GolfCharity — Play Golf. Win Prizes. Make a Difference.
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("Welcome email failed:", error)
    return { success: false, error }
  }
}

// ─── Draw Results Email ──────────────────────────────────────────

export async function sendDrawResultsEmail(to, name, { drawMonth, matchedCount, prizeAmount, winningNumbers }) {
  const isWinner = matchedCount >= 3
  const subject = isWinner
    ? `🏆 You matched ${matchedCount} numbers in the ${drawMonth} draw!`
    : `🎰 ${drawMonth} Draw Results`

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: `
        <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0f; color: #f0f0f5; padding: 40px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 1.5rem; font-weight: 700; margin: 0;">
              ${drawMonth} Draw Results
            </h1>
          </div>
          <p style="color: #b0b0c8; line-height: 1.7;">Hi ${name || "there"},</p>
          <div style="text-align: center; padding: 28px; background: #16161f; border-radius: 12px; margin: 20px 0; border: 1px solid #2a2a3c;">
            <p style="color: #8b8ba3; font-size: 0.85rem; margin: 0 0 8px;">Winning Numbers</p>
            <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
              ${(winningNumbers || []).map(n => `<span style="display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 10px; background: rgba(108, 92, 231, 0.15); font-weight: 700; font-size: 1rem; color: #a29bfe;">${n}</span>`).join("")}
            </div>
          </div>
          <div style="text-align: center; padding: 24px; background: ${isWinner ? "rgba(0, 184, 148, 0.08)" : "#16161f"}; border-radius: 12px; border: 1px solid ${isWinner ? "rgba(0, 184, 148, 0.2)" : "#2a2a3c"};">
            <p style="color: #8b8ba3; font-size: 0.85rem; margin: 0 0 4px;">You Matched</p>
            <p style="font-size: 2rem; font-weight: 800; color: ${isWinner ? "#00b894" : "#8b8ba3"}; margin: 4px 0;">
              ${matchedCount} number${matchedCount !== 1 ? "s" : ""}
            </p>
            ${isWinner ? `<p style="color: #00b894; font-size: 1.3rem; font-weight: 700; margin-top: 8px;">Prize: £${parseFloat(prizeAmount).toFixed(2)}</p>` : `<p style="color: #8b8ba3; font-size: 0.9rem;">Better luck next month!</p>`}
          </div>
          <div style="text-align: center; margin-top: 28px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard"
               style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #6c5ce7, #00cec9); color: white; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 0.9rem;">
              View Dashboard
            </a>
          </div>
          <p style="color: #8b8ba3; font-size: 0.8rem; text-align: center; margin-top: 40px;">
            GolfCharity — Play Golf. Win Prizes. Make a Difference.
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("Draw results email failed:", error)
    return { success: false, error }
  }
}

// ─── Winner Alert Email ──────────────────────────────────────────

export async function sendWinnerAlertEmail(to, name, { prizeAmount, drawMonth, matchedCount }) {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `🏆 Congratulations! You won £${parseFloat(prizeAmount).toFixed(2)} in the ${drawMonth} draw!`,
      html: `
        <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0f; color: #f0f0f5; padding: 40px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 3rem; margin-bottom: 12px;">🏆</div>
            <h1 style="font-size: 1.6rem; font-weight: 700; margin: 0;">You're a Winner!</h1>
          </div>
          <p style="color: #b0b0c8; line-height: 1.7;">Hi ${name || "there"},</p>
          <p style="color: #b0b0c8; line-height: 1.7;">
            Incredible news! You matched <strong style="color: #f0f0f5;">${matchedCount} numbers</strong>
            in the <strong style="color: #f0f0f5;">${drawMonth}</strong> draw.
          </p>
          <div style="text-align: center; padding: 32px; background: rgba(0, 184, 148, 0.06); border-radius: 12px; border: 1px solid rgba(0, 184, 148, 0.15); margin: 24px 0;">
            <p style="color: #8b8ba3; font-size: 0.85rem; margin: 0 0 8px;">Your Winnings</p>
            <p style="font-size: 2.5rem; font-weight: 800; color: #00cec9; margin: 0;">
              £${parseFloat(prizeAmount).toFixed(2)}
            </p>
          </div>
          <p style="color: #b0b0c8; line-height: 1.7;">
            To claim your prize, visit your dashboard and submit score verification.
            Our admin team will review and process your payout.
          </p>
          <div style="text-align: center; margin-top: 28px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard"
               style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6c5ce7, #00cec9); color: white; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 0.95rem;">
              Claim Your Prize →
            </a>
          </div>
          <p style="color: #8b8ba3; font-size: 0.8rem; text-align: center; margin-top: 40px;">
            GolfCharity — Play Golf. Win Prizes. Make a Difference.
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("Winner alert email failed:", error)
    return { success: false, error }
  }
}
