import { eq } from "drizzle-orm"
import { db } from "../../db/client"
import { profiles } from "../../db/schema"
import { optionalUser } from "../../utils/session"

// The signed-in member's own profile, or null when they are signed out or have
// not onboarded. The layout calls this on every page, including public ones, so
// it returns null rather than 401 for a logged-out visitor. The client uses
// null to know whether to send the member to onboarding.
export default defineEventHandler(async (event) => {
  const user = await optionalUser(event)
  if (!user) return null
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id))
  return profile ?? null
})
