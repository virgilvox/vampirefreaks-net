<template>
  <div class="flex min-h-screen flex-col bg-bg text-text">
    <div class="flex items-center justify-between px-4 py-3">
      <NuxtLink to="/" class="font-display text-xl font-bold">JIG</NuxtLink>
      <ThemeSwitcher />
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
// brand, the theme switcher, and the form in the middle.
</script>
