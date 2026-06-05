import { asc, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { journalComments, journals, profiles } from "../../db/schema"
import { optionalUser } from "../../utils/session"
import { canView } from "../../utils/friends"

// A single journal entry with its author and comments. Friends-only and private
// entries 404 for anyone who is not allowed to see them, so their existence is
// not leaked.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id") ?? ""
  const [entry] = await db
    .select({
      id: journals.id,
      userId: journals.userId,
      title: journals.title,
      body: journals.body,
      mood: journals.mood,
      visibility: journals.visibility,
      commentCount: journals.commentCount,
      createdAt: journals.createdAt,
      updatedAt: journals.updatedAt,
      username: profiles.username,
      displayName: profiles.displayName,
    })
    .from(journals)
    .innerJoin(profiles, eq(profiles.userId, journals.userId))
    .where(eq(journals.id, id))
  if (!entry) throw createError({ statusCode: 404, statusMessage: "No such entry" })

  const viewer = await optionalUser(event)
  if (!(await canView(entry.visibility, entry.userId, viewer?.id ?? null))) {
    throw createError({ statusCode: 404, statusMessage: "No such entry" })
  }

  const comments = await db
    .select({
      id: journalComments.id,
      body: journalComments.body,
      createdAt: journalComments.createdAt,
      username: profiles.username,
      displayName: profiles.displayName,
    })
    .from(journalComments)
    .innerJoin(profiles, eq(profiles.userId, journalComments.userId))
    .where(eq(journalComments.journalId, id))
    .orderBy(asc(journalComments.createdAt))

  return { ...entry, isOwner: viewer?.id === entry.userId, comments }
})
