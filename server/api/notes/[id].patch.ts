import { and, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { notes, type NewNote } from "../../db/schema"
import { requireUser } from "../../utils/session"
import { assertOwnedCategory } from "../../utils/categories"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, "id")
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "id is required" })
  }

  const body = await readBody<Record<string, unknown>>(event)
  const patch: Partial<NewNote> = { updatedAt: new Date() }
  if (typeof body?.title === "string") patch.title = body.title.trim()
  if (typeof body?.body === "string") patch.body = body.body
  if (typeof body?.done === "boolean") patch.done = body.done
  if ("categoryId" in (body ?? {})) {
    patch.categoryId =
      typeof body.categoryId === "string" && body.categoryId ? body.categoryId : null
    if (patch.categoryId) {
      await assertOwnedCategory(patch.categoryId, user.id)
    }
  }

  const [updated] = await db
    .update(notes)
    .set(patch)
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: "Note not found" })
  }
  return updated
})
