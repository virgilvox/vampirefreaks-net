<template>
  <section class="mx-auto flex max-w-2xl flex-col gap-4">
    <h1 class="vf-page-title">About</h1>
    <p>
      vampirefreaks.net brings back the VampireFreaks social network from the 2003 to 2008 era:
      profiles, ratings, cults, forums, journals, photos, messages, bands, and events. There is no
      shop.
    </p>
    <p>
      Every account is the same. There are no paid tiers and no billing, and moderation applies the
      same way to everyone.
    </p>
    <p class="text-muted">
      Read the
      <NuxtLink to="/guidelines" class="text-accent">Community Guidelines</NuxtLink>,
      <NuxtLink to="/terms" class="text-accent">Terms</NuxtLink>, and
      <NuxtLink to="/privacy" class="text-accent">Privacy Policy</NuxtLink>.
    </p>
  </section>
</template>

<script setup lang="ts">
useHead({ title: "About" })
</script>
