// Gate for pages that need a claimed username (posting, rating, messaging).
// Sends a signed-out visitor to login and a signed-in-but-un-onboarded account
// to onboarding. Runs on the server during SSR so there is no flash.
export default defineNuxtRouteMiddleware(async () => {
  const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
  const session = await $fetch("/api/me", { headers }).catch(() => null)
  if (!session || !session.user) return navigateTo("/login")

  const profile = await $fetch("/api/profile/me", { headers }).catch(() => null)
  if (!profile) return navigateTo("/onboarding")
})
