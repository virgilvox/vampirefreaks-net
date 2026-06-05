import { and, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { journals } from "../../db/schema"
import { requireProfile } from "../../utils/profile"

// Delete an entry. Owner only. Cascades to its comments via the schema.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  const id = getRouterParam(event, "id") ?? ""
  const [deleted] = await db
    .delete(journals)
    .where(and(eq(journals.id, id), eq(journals.userId, userId)))
    .returning({ id: journals.id })
  if (!deleted) throw createError({ statusCode: 404, statusMessage: "No such entry" })
  return { ok: true }
})
