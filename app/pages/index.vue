<template>
  <section class="flex flex-col gap-8">
    <div class="flex flex-col gap-4">
      <h1 class="font-display text-4xl font-bold sm:text-5xl">Clone, rename, ship.</h1>
      <p class="max-w-2xl text-lg text-muted">
        JIG is a full-stack Nuxt template with auth, a Postgres database, a base component set, and
        a swappable design system already solved. Start from a logged-in user looking at their own
        data, then build the part that is actually yours.
      </p>
      <div class="flex flex-wrap gap-3">
        <NuxtLink :to="user ? '/dashboard' : '/signup'">
          <UiButton>{{ user ? "Open dashboard" : "Get started" }}</UiButton>
        </NuxtLink>
        <NuxtLink v-if="!user" to="/login"><UiButton variant="surface">Log in</UiButton></NuxtLink>
      </div>
    </div>

    <UiCard title="Swap the whole look from one attribute">
      <p class="text-muted">
        Every component reads from design tokens. Change the theme and nothing else moves. Pick one:
      </p>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <ThemeSwitcher />
        <span class="font-display text-sm text-muted">current: {{ theme }}</span>
      </div>
    </UiCard>
  </section>
</template>

<script setup lang="ts">
useHead({ title: "Home" })

const { user } = await useCurrentUser()
const { theme } = useTheme()
</script>
