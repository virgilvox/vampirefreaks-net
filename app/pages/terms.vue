<template>
  <section class="mx-auto flex max-w-2xl flex-col gap-4">
    <h1 class="font-display text-3xl font-bold">Terms of Service</h1>
    <p class="text-muted">Draft. Review with counsel before public launch.</p>
    <p>
      By using vampirefreaks.net you agree to follow the
      <NuxtLink to="/guidelines" class="text-accent">Community Guidelines</NuxtLink>. You must be
      old enough to use the service under the laws where you live.
    </p>
    <p>
      You own what you post and grant the site a license to display it here. You are responsible for
      your account and your uploads. The site may remove content or suspend accounts that break the
      rules. There are no paid tiers; every account has the same standing.
    </p>
    <p>
      The service is provided as is. It is a community project and a homage, not the original
      company.
    </p>
  </section>
</template>

<script setup lang="ts">
useHead({ title: "Terms of Service" })
</script>
