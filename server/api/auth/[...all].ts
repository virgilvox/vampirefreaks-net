import { auth } from "../../auth"

// Mounts every better-auth endpoint (sign-in, sign-up, OAuth callbacks,
// session, sign-out) under /api/auth/*. better-auth owns the routing inside.
export default defineEventHandler((event) => auth.handler(toWebRequest(event)))
