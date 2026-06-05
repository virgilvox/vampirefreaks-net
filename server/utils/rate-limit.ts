import type { H3Event } from "h3"

// A small in-process sliding-window limiter for the write paths the auth
// limiter does not cover: messages, ratings, posts, uploads. It caps actions
// per user per window to curb spam (PRD section 12). One node process holds the
// counters; behind multiple instances this is per-instance, which is enough to
// blunt a single abusive client. DISABLE_RATE_LIMIT turns it off for tests, the
// same escape hatch the auth limiter uses.

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()
let lastSweep = 0

function disabled(): boolean {
  return process.env.DISABLE_RATE_LIMIT === "true"
}

// Drop expired buckets so the map does not grow unbounded with the
// `action:userId` key space. Runs at most once a minute, piggybacked on calls.
function sweep(now: number): void {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

// Throws 429 when the caller has spent its allowance for the window. key scopes
// the bucket, usually `${action}:${userId}`.
export function enforceRateLimit(
  event: H3Event,
  key: string,
  limit: number,
  windowMs: number,
): void {
  if (disabled()) return
  const now = Date.now()
  sweep(now)
  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  if (existing.count >= limit) {
    const retry = Math.ceil((existing.resetAt - now) / 1000)
    setResponseHeader(event, "retry-after", retry)
    throw createError({ statusCode: 429, statusMessage: "Slow down and try again shortly" })
  }
  existing.count += 1
}
