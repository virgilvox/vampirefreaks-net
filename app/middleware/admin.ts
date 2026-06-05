// Staff gate. A non-admin who reaches a staff page is sent home rather than
// shown it. The role lives on the session user (better-auth admin plugin). Runs
// on the server during SSR so staff-only content never reaches a normal account.
export default defineNuxtRouteMiddleware(async () => {
  const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
  const session = await $fetch("/api/me", { headers }).catch(() => null)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (role !== "admin") return navigateTo("/")
})
