<template>
  <section class="flex flex-col gap-4">
    <h1 class="font-display text-3xl font-bold">Moderation</h1>
    <UiCard>
      <p class="text-muted">
        The report queue, featured slots, and staff tools land with the community phase. This page
        is staff only.
      </p>
    </UiCard>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" })
useHead({ title: "Moderation" })
</script>
