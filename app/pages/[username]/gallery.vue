<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <h1 class="vf-page-title">{{ username }}'s pics</h1>
      <NuxtLink :to="`/${username}`"><UiButton variant="surface">Profile</UiButton></NuxtLink>
    </div>
    <VfPanel title="Gallery">
      <p class="vf-soon">Photo galleries on the media CDN land in the next phase.</p>
    </VfPanel>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
const username = computed(() => String(route.params.username))
useHead(() => ({ title: `${username.value}'s pics` }))
</script>

<style scoped>
.vf-page-title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  color: var(--color-text);
}
.vf-soon {
  color: var(--color-muted);
  font-size: 0.9rem;
}
</style>
