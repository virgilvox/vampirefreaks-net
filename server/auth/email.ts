type Email = { to: string; subject: string; body: string }

const RESEND_ENDPOINT = "https://api.resend.com/emails"

// Sends through Resend when RESEND_API_KEY is set, otherwise logs to the server
// console so the reset and verification links stay reachable in local dev. The
// Resend call is a plain fetch, so there is no SDK dependency to carry.
//
// For real delivery, set RESEND_API_KEY and point EMAIL_FROM at an address on a
// domain you have verified in Resend. The onboarding@resend.dev default only
// delivers to the Resend account owner and is for testing.
export async function sendEmail(email: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? "JIG <onboarding@resend.dev>"

  if (!apiKey) {
    console.log(
      `\n[email] to: ${email.to}\n[email] subject: ${email.subject}\n[email] ${email.body}\n`,
    )
    return
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from, to: email.to, subject: email.subject, text: email.body }),
  })

  if (!res.ok) {
    throw new Error(`Resend send failed (${res.status}): ${await res.text()}`)
  }
}
