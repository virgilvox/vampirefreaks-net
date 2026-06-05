import { db } from "../../db/client"
import { notes } from "../../db/schema"
import { requireUser } from "../../utils/session"
import { assertOwnedCategory } from "../../utils/categories"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{ title?: unknown; body?: unknown; categoryId?: unknown }>(event)

  const title = typeof body?.title === "string" ? body.title.trim() : ""
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: "title is required" })
  }

  const text = typeof body?.body === "string" ? body.body : ""
  const categoryId =
    typeof body?.categoryId === "string" && body.categoryId.length > 0 ? body.categoryId : null

  // A note can only point at a category the same user owns.
  if (categoryId) {
    await assertOwnedCategory(categoryId, user.id)
  }

  const [created] = await db
    .insert(notes)
    .values({ userId: user.id, title, body: text, categoryId })
    .returning()

  setResponseStatus(event, 201)
  return created
})
