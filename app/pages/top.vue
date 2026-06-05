<template>
  <section class="flex flex-col gap-6">
    <div>
      <h1 class="font-display text-3xl font-bold">Leaderboards</h1>
      <p class="text-muted">
        Rated by the community. A profile needs at least five ratings to chart.
      </p>
    </div>

    <div class="vf-tabs">
      <button
        v-for="t in tabs"
        :key="t.value"
        type="button"
        class="vf-tab"
        :class="{ 'vf-tab-on': bucket === t.value }"
        @click="bucket = t.value"
      >
        {{ t.label }}
      </button>
    </div>

    <UiCard>
      <VfLeaderboardPanel :rows="rows ?? []" :show-average="bucket !== 'newest'" />
    </UiCard>
  </section>
</template>

<script setup lang="ts">
useHead({ title: "Top members" })

const tabs = [
  { label: "Popular", value: "popular" },
  { label: "Top boys", value: "boys" },
  { label: "Top girls", value: "girls" },
  { label: "Newest", value: "newest" },
]

const bucket = ref("popular")
const { data: rows } = await useFetch(() => `/api/leaderboard?bucket=${bucket.value}`, {
  watch: [bucket],
  default: () => [],
})
</script>

<style scoped>
.vf-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  border-bottom: 2px solid var(--color-border);
}
.vf-tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  padding: 0.4rem 0.9rem;
  color: var(--color-muted);
  font-family: var(--font-display);
  cursor: pointer;
}
.vf-tab:hover {
  color: var(--color-text);
}
.vf-tab-on {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}
</style>
