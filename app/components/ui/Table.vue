<template>
  <div class="jig-table-wrap">
    <table class="jig-table">
      <thead v-if="columns.length">
        <tr>
          <th v-for="col in columns" :key="col" scope="col">{{ col }}</th>
        </tr>
      </thead>
      <tbody>
        <slot />
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
// Styled table frame. Pass column labels and write the <tr> rows in the
// default slot. Cell styling lives here so rows stay plain markup.
defineProps<{ columns: string[] }>()
</script>

<style scoped>
/* Scoped styles read tokens directly, the same contract the utility classes
   pull from, so the table retints with every theme. */
.jig-table-wrap {
  overflow-x: auto;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-block);
  box-shadow: var(--shadow-block);
}

.jig-table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--color-surface);
  color: var(--color-text);
}

.jig-table :deep(th),
.jig-table :deep(td) {
  padding: 0.625rem 0.875rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.jig-table :deep(th) {
  font-family: var(--font-display);
  font-size: 0.8125rem;
  color: var(--color-muted);
  background-color: var(--color-surface-2);
}

.jig-table :deep(tbody tr:last-child td) {
  border-bottom: none;
}
</style>
