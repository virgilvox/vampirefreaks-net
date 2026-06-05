import { fileURLToPath } from "node:url"
import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { beforeAll, describe, expect, it } from "vitest"
import { fetch, setup } from "@nuxt/test-utils/e2e"

const databaseUrl = process.env.DATABASE_URL

// Unique per run so reruns against a persistent database do not collide.
const stamp = Date.now()
const email = (tag: string): string => `e2e-${stamp}-${tag}@vf.local`
const handle = (tag: string): string =>
  `e2e${stamp}${tag}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20)
const PASSWORD = "supersecret12"
const ORIGIN = "http://localhost:3000"

function cookieHeader(res: Response): string {
  const headers = res.headers as Headers & { getSetCookie?: () => string[] }
  const all = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : []
  return all
    .map((c) => c.split(";")[0] ?? "")
    .filter(Boolean)
    .join("; ")
}

async function signUpEmail(address: string, name: string): Promise<string> {
  const res = await fetch("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, email: address, password: PASSWORD }),
  })
  expect(res.status).toBe(200)
  return cookieHeader(res)
}

async function signUp(tag: string): Promise<string> {
  return signUpEmail(email(tag), tag)
}

// Claim a username so the account can post, rate, and message.
async function onboard(cookie: string, tag: string, bucket = "everyone"): Promise<string> {
  const username = handle(tag)
  const res = await fetch("/api/profile", {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ username, leaderboardBucket: bucket, displayName: tag }),
  })
  expect(res.status).toBe(201)
  return username
}

async function member(
  tag: string,
  bucket = "everyone",
): Promise<{ cookie: string; username: string }> {
  const cookie = await signUp(tag)
  const username = await onboard(cookie, tag, bucket)
  return { cookie, username }
}

if (!databaseUrl) {
  // Skip rather than fail when no database is wired. Run with:
  // docker compose up -d db && npm run db:migrate && npm run test:e2e
  describe.skip("social e2e (set DATABASE_URL to run)", () => {
    it("skipped", () => {
      expect(true).toBe(true)
    })
  })
} else {
  describe("social e2e", async () => {
    await setup({
      rootDir: fileURLToPath(new URL("../..", import.meta.url)),
      server: true,
      build: true,
    })

    beforeAll(async () => {
      const pool = new Pool({ connectionString: databaseUrl })
      await migrate(drizzle(pool), { migrationsFolder: "server/db/migrations" })
      await pool.end()
    })

    it("signs up and exposes the user through /api/me without the session token", async () => {
      const cookie = await signUp("me")
      const res = await fetch("/api/me", { headers: { cookie } })
      const text = await res.text()
      expect(text).not.toContain('"token"')
      const body = JSON.parse(text) as { user: { email: string } | null }
      expect(body.user?.email).toBe(email("me"))
    })

    it("rejects profile creation for a signed-out visitor", async () => {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: handle("anon") }),
      })
      expect(res.status).toBe(401)
    })

    it("claims a username and rejects a duplicate", async () => {
      const cookie = await signUp("claim")
      const username = await onboard(cookie, "claim")

      const other = await signUp("claim2")
      const dup = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: other },
        body: JSON.stringify({ username }),
      })
      expect(dup.status).toBe(409)
    })

    it("blocks an un-onboarded account from rating", async () => {
      const target = await member("rtarget")
      const bareCookie = await signUp("bare")
      const res = await fetch(`/api/profiles/${target.username}/rating`, {
        method: "PUT",
        headers: { "content-type": "application/json", cookie: bareCookie },
        body: JSON.stringify({ score: 8 }),
      })
      expect(res.status).toBe(403)
    })

    it("rates another member and reflects the average, rejecting self and out-of-range", async () => {
      const a = await member("rater")
      const b = await member("ratee")

      const rate = await fetch(`/api/profiles/${b.username}/rating`, {
        method: "PUT",
        headers: { "content-type": "application/json", cookie: a.cookie },
        body: JSON.stringify({ score: 8 }),
      })
      expect(rate.status).toBe(200)
      const body = (await rate.json()) as { average: number; ratingCount: number }
      expect(body.average).toBe(8)
      expect(body.ratingCount).toBe(1)

      const pub = (await (await fetch(`/api/profiles/${b.username}`)).json()) as { average: number }
      expect(pub.average).toBe(8)

      const selfRate = await fetch(`/api/profiles/${a.username}/rating`, {
        method: "PUT",
        headers: { "content-type": "application/json", cookie: a.cookie },
        body: JSON.stringify({ score: 5 }),
      })
      expect(selfRate.status).toBe(400)

      const bad = await fetch(`/api/profiles/${b.username}/rating`, {
        method: "PUT",
        headers: { "content-type": "application/json", cookie: a.cookie },
        body: JSON.stringify({ score: 11 }),
      })
      expect(bad.status).toBe(400)
    })

    it("re-rating overwrites the prior score rather than stacking", async () => {
      const a = await member("rerater")
      const b = await member("reratee")
      const url = `/api/profiles/${b.username}/rating`
      const opts = (score: number) => ({
        method: "PUT" as const,
        headers: { "content-type": "application/json", cookie: a.cookie },
        body: JSON.stringify({ score }),
      })
      await fetch(url, opts(3))
      const second = (await (await fetch(url, opts(9))).json()) as {
        average: number
        ratingCount: number
      }
      expect(second.ratingCount).toBe(1)
      expect(second.average).toBe(9)
    })

    it("lists newest members on the leaderboard", async () => {
      const m = await member("newbie")
      const rows = (await (await fetch("/api/leaderboard?bucket=newest")).json()) as Array<{
        username: string
      }>
      expect(rows.some((r) => r.username === m.username)).toBe(true)
    })

    it("sends a friend request and lets the other accept", async () => {
      const a = await member("fa")
      const b = await member("fb")

      const req = await fetch(`/api/friends/${b.username}`, {
        method: "POST",
        headers: { cookie: a.cookie },
      })
      expect(req.status).toBe(201)

      const accept = await fetch(`/api/friends/${a.username}/respond`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie: b.cookie },
        body: JSON.stringify({ action: "accept" }),
      })
      expect(accept.status).toBe(200)

      const view = (await (
        await fetch(`/api/profiles/${b.username}`, { headers: { cookie: a.cookie } })
      ).json()) as {
        friendStatus: string
      }
      expect(view.friendStatus).toBe("friends")

      const friends = (await (await fetch(`/api/profiles/${a.username}/friends`)).json()) as Array<{
        username: string
      }>
      expect(friends.some((f) => f.username === b.username)).toBe(true)
    })

    it("delivers a private message only to the two parties", async () => {
      const a = await member("ma")
      const b = await member("mb")

      const send = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: a.cookie },
        body: JSON.stringify({ to: b.username, subject: "hi", body: "from the crypt" }),
      })
      expect(send.status).toBe(201)

      const inbox = (await (
        await fetch("/api/messages", { headers: { cookie: b.cookie } })
      ).json()) as Array<{
        body: string
      }>
      expect(inbox.some((m) => m.body === "from the crypt")).toBe(true)

      const c = await member("mc")
      const otherInbox = (await (
        await fetch("/api/messages", { headers: { cookie: c.cookie } })
      ).json()) as unknown[]
      expect(otherInbox).toHaveLength(0)
    })

    it("creates an organization when the Origin header is present", async () => {
      const cookie = await signUp("org")
      const res = await fetch("/api/auth/organization/create", {
        method: "POST",
        headers: { "content-type": "application/json", cookie, origin: ORIGIN },
        body: JSON.stringify({ name: "Acme QA", slug: `acme-${stamp}` }),
      })
      expect(res.status).toBe(200)
      const org = (await res.json()) as { slug: string }
      expect(org.slug).toBe(`acme-${stamp}`)
    })

    it("invites a member and lets the invited user accept", async () => {
      const inviterCookie = await signUp("inviter")
      const orgRes = await fetch("/api/auth/organization/create", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: inviterCookie, origin: ORIGIN },
        body: JSON.stringify({ name: "Members Org", slug: `members-${stamp}` }),
      })
      expect(orgRes.status).toBe(200)
      const org = (await orgRes.json()) as { id: string }

      const inviteeEmail = email("invitee")
      const inviteRes = await fetch("/api/auth/organization/invite-member", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: inviterCookie, origin: ORIGIN },
        body: JSON.stringify({ email: inviteeEmail, role: "member", organizationId: org.id }),
      })
      expect(inviteRes.status).toBe(200)
      const invite = (await inviteRes.json()) as { id: string }
      expect(invite.id).toBeTruthy()

      const inviteeCookie = await signUpEmail(inviteeEmail, "Invitee")
      const acceptRes = await fetch("/api/auth/organization/accept-invitation", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: inviteeCookie, origin: ORIGIN },
        body: JSON.stringify({ invitationId: invite.id }),
      })
      expect(acceptRes.status).toBe(200)

      const full = (await (
        await fetch(`/api/auth/organization/get-full-organization?organizationId=${org.id}`, {
          headers: { cookie: inviterCookie, origin: ORIGIN },
        })
      ).json()) as { members: Array<{ role: string }> }
      expect(full.members.length).toBe(2)
    })
  })
}
