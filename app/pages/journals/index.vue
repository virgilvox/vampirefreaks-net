<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <h1 class="vf-page-title">Journals</h1>
      <NuxtLink v-if="profile" to="/account/journal/new"><UiButton>Write entry</UiButton></NuxtLink>
    </div>

    <VfPanel title="Recent public journals" flush>
      <div v-if="entries && entries.length">
        <VfJournalCard v-for="e in entries" :key="e.id" :entry="e" />
      </div>
      <p v-else class="vf-empty">No journals yet. Be the first to vent.</p>
    </VfPanel>
  </section>
</template>

<script setup lang="ts">
useHead({ title: "Journals" })

const { profile } = await useProfile()

type Entry = {
  id: string
  title: string
  body: string
  mood: string | null
  commentCount: number
  createdAt: string
  username: string
  displayName: string | null
}
const { data: entries } = await useFetch<Entry[]>("/api/feed/journals", { default: () => [] })
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
