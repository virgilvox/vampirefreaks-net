<template>
  <div class="jig-card rounded-block border-2 border-border bg-surface text-text shadow-block">
    <header v-if="$slots.header || title" class="border-b-2 border-border px-5 py-4">
      <slot name="header">
        <h2 class="font-display text-lg font-semibold">{{ title }}</h2>
        <p v-if="subtitle" class="text-sm text-muted">{{ subtitle }}</p>
      </slot>
    </header>

    <div class="px-5 py-4">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="border-t-2 border-border px-5 py-4">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title?: string; subtitle?: string }>()
</script>
