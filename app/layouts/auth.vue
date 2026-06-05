<template>
  <div class="flex min-h-screen flex-col bg-bg text-text">
    <div class="flex items-center px-4 py-3">
      <NuxtLink to="/" class="vf-auth-logo">vampirefreaks</NuxtLink>
    </div>

    <div class="flex flex-1 items-center justify-center px-4 py-8">
      <div class="w-full max-w-sm">
        <slot />
      </div>
    </div>

    <UiToaster />
  </div>
</template>

<script setup lang="ts">
// Centered shell for the auth flow pages. No nav, no session lookup, just the
// wordmark and the form in the middle.
</script>

<style scoped>
.vf-auth-logo {
  font-family: var(--font-display);
  font-size: 1.9rem;
  line-height: 1;
  color: var(--color-accent);
  letter-spacing: 0.02em;
}
</style>
