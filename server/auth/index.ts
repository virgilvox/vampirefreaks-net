import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { organization } from "better-auth/plugins"
import { passkey } from "@better-auth/passkey"
import { db } from "../db/client"
import * as schema from "../db/schema"
import { sendEmail } from "./email"

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"

// Sessions are signed with this secret. An empty secret in production would let
// anyone forge a session, so fail fast instead of booting insecure.
if (process.env.NODE_ENV === "production" && !process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET must be set in production.")
}

type OAuthCredentials = { clientId: string; clientSecret: string }

// A provider only switches on when both halves of its key pair are present,
// so a clone with no OAuth config still boots with email and password working.
function socialProviders(): Record<string, OAuthCredentials> {
  const providers: Record<string, OAuthCredentials> = {}
  const env = process.env

  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    providers.github = { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET }
  }
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
  }
  return providers
}

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  plugins: [
    // WebAuthn passkeys. rpID is the domain the credential is bound to; it is
    // the hostname of the base URL, so localhost in dev and your domain in prod.
    passkey({ rpName: "JIG", rpID: new URL(baseURL).hostname, origin: baseURL }),
    // Multi-tenant primitives: organizations, members, invitations. Available
    // but never forced. The example notes app stays single-user; wire your own
    // data to the active organization when a product needs tenancy.
    organization({
      // Match the email-verification stance: when verification is required,
      // an invitee must verify before accepting; otherwise a fresh clone can
      // accept invitations without email set up.
      requireEmailVerificationOnInvitation: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
      sendInvitationEmail: async (data) => {
        const url = `${baseURL}/accept-invitation?id=${data.id}`
        await sendEmail({
          to: data.email,
          subject: `Join ${data.organization.name}`,
          body: `You have been invited to join ${data.organization.name}. Accept here: ${url}`,
        })
      },
    }),
  ],
  emailAndPassword: {
    enabled: true,
    // Off by default so a fresh clone signs in immediately. Set
    // REQUIRE_EMAIL_VERIFICATION=true (with Resend configured) to enforce it.
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        body: `Reset your password: ${url}`,
      })
    },
  },
  // Rate limiting is on by default in production. Tests run many sign-ups from
  // one host, which the limiter would (correctly) block, so they set
  // DISABLE_RATE_LIMIT. Never set it in production.
  rateLimit: process.env.DISABLE_RATE_LIMIT === "true" ? { enabled: false } : undefined,
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        body: `Verify your email: ${url}`,
      })
    },
  },
  socialProviders: socialProviders(),
})

export type Auth = typeof auth
export type SessionUser = typeof auth.$Infer.Session.user
