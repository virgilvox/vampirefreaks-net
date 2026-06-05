<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <h1 class="vf-page-title">{{ username }}'s journal</h1>
      <NuxtLink :to="`/${username}`"><UiButton variant="surface">Profile</UiButton></NuxtLink>
    </div>

    <VfPanel flush>
      <div v-if="entries && entries.length">
        <VfJournalCard v-for="e in entries" :key="e.id" :entry="{ ...e, username }" />
      </div>
      <p v-else class="vf-empty">No entries here yet.</p>
    </VfPanel>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
const username = computed(() => String(route.params.username))
useHead(() => ({ title: `${username.value}'s journal` }))

type Entry = {
  id: string
  title: string
  body: string
  mood: string | null
  visibility: string
  commentCount: number
  createdAt: string
}
const { data: entries } = await useFetch<Entry[]>(
  () => `/api/profiles/${username.value}/journals`,
  {
    default: () => [],
  },
)
</script>

<style scoped>
.vf-page-title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  color: var(--color-text);
}
.vf-empty {
  padding: 0.6rem;
  color: var(--color-muted);
  font-style: italic;
}
</style>
