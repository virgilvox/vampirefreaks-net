import type { SessionUser } from "../../server/auth"

type MeResponse = { user: SessionUser | null }

// SSR-friendly read of the signed-in user. Hits /api/me, forwards the cookie
// during server render, and caches under one key so pages and the layout share
// a single fetch. Call refresh() after a sign-in or sign-out to re-read.
export async function useCurrentUser(): Promise<{
  user: ComputedRef<SessionUser | null>
  refresh: () => Promise<void>
}> {
  const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
  const { data, refresh } = await useFetch<MeResponse>("/api/me", {
    key: "current-session",
    headers,
  })
  const user = computed<SessionUser | null>(() => data.value?.user ?? null)
  return { user, refresh }
}
