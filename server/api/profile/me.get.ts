import { eq } from "drizzle-orm"
import { db } from "../../db/client"
import { profiles } from "../../db/schema"
import { requireUser } from "../../utils/session"

// The signed-in member's own profile, or null when they have not onboarded.
// The client uses null to know it should send them to /onboarding.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id))
  return profile ?? null
})
