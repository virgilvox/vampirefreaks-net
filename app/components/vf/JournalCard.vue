<template>
  <article class="vf-jcard">
    <div class="vf-jcard-head">
      <NuxtLink :to="`/${entry.username}/journal/${entry.id}`" class="vf-jcard-title">{{
        entry.title
      }}</NuxtLink>
      <span v-if="entry.visibility && entry.visibility !== 'public'" class="vf-jcard-vis">{{
        entry.visibility
      }}</span>
    </div>
    <p class="vf-jcard-meta">
      <NuxtLink v-if="entry.username" :to="`/${entry.username}`" class="vf-jcard-author">
        {{ entry.displayName || entry.username }}
      </NuxtLink>
      <span v-if="entry.mood">· {{ entry.mood }}</span>
      <span>· {{ when }}</span>
      <span v-if="typeof entry.commentCount === 'number'">· {{ entry.commentCount }} comments</span>
    </p>
    <p v-if="snippet" class="vf-jcard-snippet">{{ snippet }}</p>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{
  entry: {
    id: string
    title: string
    body?: string | null
    mood?: string | null
    visibility?: string | null
    commentCount?: number
    createdAt: string
    username?: string | null
    displayName?: string | null
  }
}>()

const when = computed(() => new Date(props.entry.createdAt).toLocaleDateString())
const snippet = computed(() => {
  const b = (props.entry.body ?? "").trim()
  return b.length > 200 ? `${b.slice(0, 200)}...` : b
})
</script>

<style scoped>
.vf-jcard {
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
}
.vf-jcard:last-child {
  border-bottom: none;
}
.vf-jcard-head {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.vf-jcard-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--color-accent);
  text-decoration: none;
}
.vf-jcard-title:hover {
  text-decoration: underline;
}
.vf-jcard-vis {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-block);
  padding: 0 0.3rem;
}
.vf-jcard-meta {
  font-size: 0.74rem;
  color: var(--color-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.15rem;
}
.vf-jcard-author {
  color: var(--color-text);
  text-decoration: none;
}
.vf-jcard-author:hover {
  color: var(--color-accent);
}
.vf-jcard-snippet {
  margin-top: 0.3rem;
  font-size: 0.83rem;
  color: var(--color-text);
  white-space: pre-wrap;
}
</style>
