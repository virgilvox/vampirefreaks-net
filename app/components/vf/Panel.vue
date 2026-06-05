<template>
  <section class="vf-panel">
    <header v-if="title || $slots.title" class="vf-panel-bar">
      <span class="vf-panel-title"
        ><slot name="title">{{ title }}</slot></span
      >
      <span v-if="$slots.action" class="vf-panel-action"><slot name="action" /></span>
    </header>
    <div :class="['vf-panel-body', { 'vf-panel-flush': flush }]">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
// The boxed section the era used everywhere: a thin gradient title bar in caps
// over a dark body. Title is uppercase small caps, the way FEATURED MEMBER and
// TOP CULTS read in the original. flush drops body padding for list panels.
withDefaults(defineProps<{ title?: string; flush?: boolean }>(), { flush: false })
</script>

<style scoped>
.vf-panel {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-block);
  background: var(--color-surface);
  overflow: hidden;
}
.vf-panel-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.3rem 0.6rem;
  background: linear-gradient(180deg, var(--color-surface-2), var(--color-surface));
  border-bottom: 1px solid var(--color-border);
}
.vf-panel-title {
  font-family: var(--font-body);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-muted);
}
.vf-panel-action {
  font-size: 0.7rem;
}
.vf-panel-body {
  padding: 0.6rem;
  font-size: 0.82rem;
}
.vf-panel-flush {
  padding: 0;
}
</style>
