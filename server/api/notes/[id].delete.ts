import { and, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { notes } from "../../db/schema"
import { requireUser } from "../../utils/session"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, "id")
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "id is required" })
  }

  const [deleted] = await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
    .returning({ id: notes.id })

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: "Note not found" })
  }
  return { id: deleted.id }
})
