<template>
  <div class="min-h-screen bg-bg text-text">
    <header class="border-b-2 border-border bg-surface">
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <NuxtLink to="/" class="font-display text-xl font-bold">JIG</NuxtLink>

        <div class="flex items-center gap-3">
          <ThemeSwitcher />

          <UiDropdown v-if="user" :items="menuItems">
            <template #trigger>
              <UiButton variant="surface">{{ user.email }}</UiButton>
            </template>
          </UiDropdown>

          <template v-else>
            <NuxtLink to="/login"><UiButton variant="ghost">Log in</UiButton></NuxtLink>
            <NuxtLink to="/signup"><UiButton>Sign up</UiButton></NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8">
      <slot />
    </main>

    <UiToaster />
  </div>
</template>

<script setup lang="ts">
import type { DropdownItem } from "./../components/ui/Dropdown.vue"

const { user, refresh } = await useCurrentUser()

async function logout(): Promise<void> {
  await authClient.signOut()
  await refresh()
  await navigateTo("/login")
}

const menuItems = computed<DropdownItem[]>(() => [
  { label: "Dashboard", onSelect: () => navigateTo("/dashboard") },
  { label: "Organizations", onSelect: () => navigateTo("/organizations") },
  { label: "Account", onSelect: () => navigateTo("/account") },
  { separator: true },
  { label: "Log out", onSelect: logout, danger: true },
])
</script>
