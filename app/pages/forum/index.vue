<template>
  <section class="flex flex-col gap-3">
    <h1 class="vf-page-title">Messageboard</h1>

    <VfPanel flush>
      <ul class="vf-boards">
        <li v-for="b in boards" :key="b.slug">
          <NuxtLink :to="`/forum/${b.slug}`" class="vf-board">
            <span class="vf-board-mark" aria-hidden="true">&#9656;</span>
            <span class="vf-board-main">
              <span class="vf-board-name">{{ b.name }}</span>
              <span class="vf-board-desc">{{ b.description }}</span>
            </span>
            <span class="vf-board-count">{{ b.threadCount }} threads</span>
          </NuxtLink>
        </li>
        <li v-if="!boards || boards.length === 0" class="vf-empty">No boards yet.</li>
      </ul>
    </VfPanel>
  </section>
</template>

<script setup lang="ts">
useHead({ title: "Messageboard" })

type Board = { id: string; name: string; slug: string; description: string; threadCount: number }
const { data: boards } = await useFetch<Board[]>("/api/boards", { default: () => [] })
</script>

<style scoped>
.vf-page-title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  color: var(--color-text);
}
.vf-boards {
  list-style: none;
  margin: 0;
  padding: 0;
}
.vf-board {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.7rem;
  border-bottom: 1px solid var(--color-border);
  text-decoration: none;
  color: var(--color-text);
}
.vf-boards li:last-child .vf-board {
  border-bottom: none;
}
.vf-board:hover {
  background: var(--color-surface-2);
}
.vf-board-mark {
  color: var(--color-accent);
}
.vf-board-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.vf-board-name {
  font-weight: 700;
  color: var(--color-accent);
}
.vf-board-desc {
  font-size: 0.8rem;
  color: var(--color-muted);
}
.vf-board-count {
  font-size: 0.76rem;
  color: var(--color-muted);
  white-space: nowrap;
}
.vf-empty {
  padding: 0.6rem;
  color: var(--color-muted);
  font-style: italic;
}
</style>
