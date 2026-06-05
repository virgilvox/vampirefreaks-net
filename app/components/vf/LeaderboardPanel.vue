<template>
  <div class="vf-board">
    <ol class="vf-board-list">
      <li v-for="(row, i) in rows" :key="row.username" class="vf-board-row">
        <span class="vf-rank">{{ i + 1 }}</span>
        <img
          v-if="row.avatarUrl"
          :src="row.avatarUrl"
          :alt="`${row.username} avatar`"
          class="vf-board-avatar"
        />
        <NuxtLink :to="`/${row.username}`" class="vf-board-name">
          {{ row.displayName || row.username }}
        </NuxtLink>
        <span v-if="showAverage && row.average != null" class="vf-board-score">
          {{ Number(row.average).toFixed(1) }}
        </span>
      </li>
    </ol>
    <p v-if="rows.length === 0" class="vf-board-empty">No one here yet.</p>
  </div>
</template>

<script setup lang="ts">
type Row = {
  username: string
  displayName?: string | null
  avatarUrl?: string | null
  average?: number | null
  ratingCount?: number | null
}

withDefaults(defineProps<{ rows: Row[]; showAverage?: boolean }>(), { showAverage: true })
</script>

<style scoped>
.vf-board-list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}
.vf-board-avatar {
  width: 1.2rem;
  height: 1.2rem;
  object-fit: cover;
  border-radius: var(--radius-block);
  align-self: center;
}
.vf-board-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.9rem;
}
.vf-board-row:last-child {
  border-bottom: none;
}
.vf-rank {
  font-family: var(--font-display);
  color: var(--color-muted);
  width: 1.5rem;
  text-align: right;
}
.vf-board-name {
  flex: 1;
  color: var(--color-text);
  text-decoration: none;
}
.vf-board-name:hover {
  color: var(--color-accent);
  text-decoration: underline;
}
.vf-board-score {
  font-family: var(--font-display);
  color: var(--color-accent);
}
.vf-board-empty {
  color: var(--color-muted);
  font-style: italic;
  font-size: 0.9rem;
}
</style>
