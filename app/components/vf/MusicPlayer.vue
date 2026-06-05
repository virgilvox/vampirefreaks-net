<template>
  <div class="vf-player">
    <span class="vf-player-mark" aria-hidden="true">&#9834;</span>
    <div class="vf-player-main">
      <span class="vf-player-title">{{ title }}</span>
      <audio :src="src" controls preload="none" class="vf-player-audio" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Plays a track with a visible control and no autoplay, which is both the
// modern-browser default and the kinder choice on a content-dense page.
defineProps<{ src: string; title: string }>()
</script>

<style scoped>
.vf-player {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-block);
  background: var(--color-surface);
}
.vf-player-mark {
  color: var(--color-accent);
  font-size: 1.2rem;
}
.vf-player-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.vf-player-title {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-text);
}
.vf-player-audio {
  width: 100%;
  height: 2rem;
}
</style>
