// Route guard for protected pages. Add `definePageMeta({ middleware: "auth" })`
// to a page and it redirects to /login unless a session is present. The check
// runs on the server during SSR so there is no protected-content flash.
export default defineNuxtRouteMiddleware(async () => {
  const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
  const session = await $fetch("/api/me", { headers }).catch(() => null)

  if (!session || !session.user) {
    return navigateTo("/login")
  }
})
