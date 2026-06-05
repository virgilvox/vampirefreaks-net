import type { H3Event } from "h3"
import { and, eq } from "drizzle-orm"
import { db } from "../db/client"
import { cultMembers, cults, type Cult } from "../db/schema"

// Display name to url-safe slug: lowercase, non-alphanumeric runs collapsed to
// single dashes, trimmed. Server-local copy so server code does not reach into
// the app build for the same one-liner.
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// Public lookup by slug. Returns null so a handler can shape its own 404.
export async function getCultBySlug(slug: string): Promise<Cult | null> {
  const [cult] = await db.select().from(cults).where(eq(cults.slug, slug.toLowerCase()))
  return cult ?? null
}

// The viewer's membership row in a cult, or null. Used to decide join/leave
// state and to gate management actions.
export async function membership(
  cultId: string,
  userId: string,
): Promise<{ role: string; status: string } | null> {
  const [row] = await db
    .select({ role: cultMembers.role, status: cultMembers.status })
    .from(cultMembers)
    .where(and(eq(cultMembers.cultId, cultId), eq(cultMembers.userId, userId)))
  return row ?? null
}

// Throws unless the user is an active owner or moderator of the cult, the gate
// for managing members and cult settings.
export async function assertCultManager(
  event: H3Event,
  cultId: string,
  userId: string,
): Promise<string> {
  const m = await membership(cultId, userId)
  if (!m || m.status !== "active" || (m.role !== "owner" && m.role !== "moderator")) {
    throw createError({ statusCode: 403, statusMessage: "Cult staff only" })
  }
  return m.role
}
