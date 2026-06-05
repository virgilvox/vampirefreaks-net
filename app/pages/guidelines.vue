<template>
  <section class="mx-auto flex max-w-2xl flex-col gap-4">
    <h1 class="font-display text-3xl font-bold">Community Guidelines</h1>
    <p>This is a scene, not a free-for-all. A few rules keep it that way.</p>
    <ul class="vf-list">
      <li>No harassment, hate, or targeting of any person or group.</li>
      <li>
        No content sexualizing minors, ever. This is a permanent ban and a report to authorities.
      </li>
      <li>Adults do not pursue minors. Accounts marked under 18 have locked-down messaging.</li>
      <li>
        Rate profiles honestly. Coordinated rating, vote brigading, and harassment by rating are not
        allowed.
      </li>
      <li>Keep uploads to your own work or work you have the right to share.</li>
      <li>
        Report what crosses the line. Staff act on every account the same way, with no paid
        exceptions.
      </li>
    </ul>
    <p class="text-muted">Breaking these gets content removed and accounts suspended or banned.</p>
  </section>
</template>

<script setup lang="ts">
useHead({ title: "Community Guidelines" })
</script>

<style scoped>
.vf-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-left: 1.25rem;
}
.vf-list li {
  list-style: disc;
}
</style>
