<template>
  <section class="mx-auto flex max-w-2xl flex-col gap-4">
    <h1 class="font-display text-3xl font-bold">About</h1>
    <p>
      vampirefreaks.net is a revival of the VampireFreaks social network era, roughly 2003 to 2008.
      It rebuilds the social network only: profiles, ratings, cults, forums, journals, photos,
      messages, bands, and events. There is no store and no commerce.
    </p>
    <p>
      This is a homage, built by and for the goth and industrial scene. The original site had a
      documented dark side, including a moderation policy that shielded paying members. This project
      has no paid tiers and no billing, so moderation applies equally to every account.
    </p>
    <p class="text-muted">
      Built on the JIG stack. Read the
      <NuxtLink to="/guidelines" class="text-accent">Community Guidelines</NuxtLink>,
      <NuxtLink to="/terms" class="text-accent">Terms</NuxtLink>, and
      <NuxtLink to="/privacy" class="text-accent">Privacy Policy</NuxtLink>.
    </p>
  </section>
</template>

<script setup lang="ts">
useHead({ title: "About" })
</script>
