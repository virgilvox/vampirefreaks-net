import { desc, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { notes } from "../../db/schema"
import { requireUser } from "../../utils/session"

// A user only ever sees their own notes. The userId filter is the whole
// authorization story here, applied on every read and write.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return db.select().from(notes).where(eq(notes.userId, user.id)).orderBy(desc(notes.createdAt))
})
