import { auth } from "../auth"

// Server-rendered session read. Route middleware and the layout call this so a
// protected page knows on the server whether to redirect before any client JS
// runs. Returns only the user, never the session token: that token is the
// bearer credential and stays in the httpOnly cookie, out of reach of client JS.
export default defineEventHandler(async (event) => {
  const result = await auth.api.getSession({ headers: event.headers })
  return { user: result?.user ?? null }
})
