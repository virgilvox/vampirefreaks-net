import type { Profile } from "../../server/db/schema"

// SSR-friendly read of the signed-in member's own profile, shared under one key
// like useCurrentUser. Null means the account has not claimed a username yet, so
// callers route it to onboarding. Call refresh() after onboarding or an edit.
export async function useProfile(): Promise<{
  profile: ComputedRef<Profile | null>
  refresh: () => Promise<void>
}> {
  const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
  const { data, refresh } = await useFetch<Profile | null>("/api/profile/me", {
    key: "current-profile",
    headers,
    default: () => null,
  })
  const profile = computed<Profile | null>(() => data.value ?? null)
  return { profile, refresh }
}
