<template>
  <div class="min-h-screen bg-bg text-text">
    <header class="border-b-2 border-border bg-surface">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <NuxtLink to="/" class="vf-wordmark">vampirefreaks</NuxtLink>

        <nav class="hidden items-center gap-4 text-sm md:flex">
          <NuxtLink to="/top" class="vf-nav">Top</NuxtLink>
          <NuxtLink to="/cults" class="vf-nav">Cults</NuxtLink>
          <NuxtLink to="/forum" class="vf-nav">Forum</NuxtLink>
          <NuxtLink to="/events" class="vf-nav">Events</NuxtLink>
          <NuxtLink v-if="user" to="/messages" class="vf-nav">Messages</NuxtLink>
        </nav>

        <div class="flex items-center gap-3">
          <ThemeSwitcher />
          <UiDropdown v-if="user" :items="menuItems">
            <template #trigger>
              <UiButton variant="surface">{{ profile?.username || user.email }}</UiButton>
            </template>
          </UiDropdown>
          <template v-else>
            <NuxtLink to="/login"><UiButton variant="ghost">Log in</UiButton></NuxtLink>
            <NuxtLink to="/signup"><UiButton>Join</UiButton></NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8">
      <slot />
    </main>

    <footer class="mt-12 border-t-2 border-border bg-surface">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-6 text-sm text-muted">
        <NuxtLink to="/about" class="vf-nav">About</NuxtLink>
        <NuxtLink to="/guidelines" class="vf-nav">Community Guidelines</NuxtLink>
        <NuxtLink to="/terms" class="vf-nav">Terms of Service</NuxtLink>
        <NuxtLink to="/privacy" class="vf-nav">Privacy</NuxtLink>
        <span class="ml-auto">A homage to the goth and industrial era, rebuilt.</span>
      </div>
    </footer>

    <UiToaster />
  </div>
</template>

<script setup lang="ts">
import type { DropdownItem } from "./../components/ui/Dropdown.vue"

const { user, refresh } = await useCurrentUser()
const { profile } = await useProfile()

async function logout(): Promise<void> {
  await authClient.signOut()
  await refresh()
  await navigateTo("/login")
}

const menuItems = computed<DropdownItem[]>(() => {
  const items: DropdownItem[] = []
  if (profile.value) {
    items.push({ label: "My profile", onSelect: () => navigateTo(`/${profile.value?.username}`) })
    items.push({ label: "Messages", onSelect: () => navigateTo("/messages") })
    items.push({
      label: "Friends",
      onSelect: () => navigateTo(`/${profile.value?.username}/friends`),
    })
  } else {
    items.push({ label: "Finish setup", onSelect: () => navigateTo("/onboarding") })
  }
  items.push({ label: "Account", onSelect: () => navigateTo("/account") })
  if ((user.value as { role?: string } | null)?.role === "admin") {
    items.push({ label: "Admin", onSelect: () => navigateTo("/admin") })
  }
  items.push({ separator: true })
  items.push({ label: "Log out", onSelect: logout, danger: true })
  return items
})
</script>

<style scoped>
.vf-wordmark {
  font-family: var(--font-display);
  font-size: 1.75rem;
  line-height: 1;
  color: var(--color-accent);
  letter-spacing: 0.02em;
}
.vf-nav {
  color: var(--color-muted);
  text-decoration: none;
}
.vf-nav:hover {
  color: var(--color-accent);
}
.router-link-active.vf-nav {
  color: var(--color-text);
}
</style>
