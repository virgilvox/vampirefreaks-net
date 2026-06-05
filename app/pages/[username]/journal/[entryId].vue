<template>
  <section v-if="entry" class="flex flex-col gap-3">
    <article class="vf-entry">
      <header class="vf-entry-head">
        <div>
          <h1 class="vf-entry-title">{{ entry.title }}</h1>
          <p class="vf-entry-meta">
            <NuxtLink :to="`/${entry.username}`" class="vf-entry-author">{{
              entry.displayName || entry.username
            }}</NuxtLink>
            <span v-if="entry.mood">· feeling {{ entry.mood }}</span>
            <span>· {{ when(entry.createdAt) }}</span>
            <span v-if="entry.visibility !== 'public'" class="vf-entry-vis">{{
              entry.visibility
            }}</span>
          </p>
        </div>
        <div v-if="entry.isOwner" class="vf-entry-actions">
          <NuxtLink :to="`/account/journal/new?id=${entry.id}`"
            ><UiButton variant="surface">Edit</UiButton></NuxtLink
          >
          <UiButton variant="danger" @click="remove">Delete</UiButton>
        </div>
      </header>
      <div class="vf-entry-body">{{ entry.body }}</div>
    </article>

    <VfPanel :title="`${entry.commentCount} comments`" flush>
      <ul class="vf-comments">
        <li v-for="c in entry.comments" :key="c.id">
          <NuxtLink :to="`/${c.username}`" class="vf-comment-author">{{
            c.displayName || c.username
          }}</NuxtLink>
          <span class="vf-comment-when">{{ when(c.createdAt) }}</span>
          <p class="vf-comment-body">{{ c.body }}</p>
        </li>
        <li v-if="entry.comments.length === 0" class="vf-empty">No comments yet.</li>
      </ul>

      <form v-if="canComment" class="vf-comment-form" @submit.prevent="comment">
        <textarea
          v-model="commentText"
          rows="2"
          class="jig-input w-full rounded-block border-2 border-border bg-surface px-3 py-2 text-text"
          placeholder="Leave a comment"
        />
        <UiButton type="submit" :disabled="commenting || !commentText.trim()">Post</UiButton>
      </form>
      <p v-else class="vf-empty">
        <NuxtLink to="/login" class="text-accent">Log in</NuxtLink> to comment.
      </p>
    </VfPanel>
  </section>

  <section v-else class="py-16 text-center text-muted">No such entry.</section>
</template>

<script setup lang="ts">
const route = useRoute()
const { push } = useToast()
const { user } = await useCurrentUser()
const canComment = computed(() => Boolean(user.value))

// Coerce so the URL is a plain string the typed $fetch matches to the
// id route (which has get, patch, and delete handlers).
const entryId = String(route.params.entryId)
const usernameParam = String(route.params.username)

type Comment = {
  id: string
  body: string
  createdAt: string
  username: string
  displayName: string | null
}
type Entry = {
  id: string
  title: string
  body: string
  mood: string | null
  visibility: string
  commentCount: number
  createdAt: string
  username: string
  displayName: string | null
  isOwner: boolean
  comments: Comment[]
}

const { data: entry, refresh } = await useFetch<Entry | null>(`/api/journals/${entryId}`, {
  default: () => null,
})

useHead(() => ({ title: entry.value?.title || "Journal" }))

function when(v: string): string {
  return new Date(v).toLocaleString()
}

const commentText = ref("")
const commenting = ref(false)
async function comment(): Promise<void> {
  if (!commentText.value.trim()) return
  commenting.value = true
  try {
    await $fetch(`/api/journals/${entryId}/comments`, {
      method: "POST",
      body: { body: commentText.value },
    })
    commentText.value = ""
    await refresh()
  } catch {
    push({ title: "Could not post comment", variant: "danger" })
  } finally {
    commenting.value = false
  }
}

async function remove(): Promise<void> {
  await $fetch(`/api/journals/${entryId}`, { method: "DELETE" }).catch(() => null)
  await navigateTo(`/${usernameParam}/journal`)
}
</script>

<style scoped>
.vf-entry {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-block);
  background: var(--color-surface);
  padding: 0.9rem;
}
.vf-entry-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.vf-entry-title {
  font-family: var(--font-display);
  font-size: 1.7rem;
  color: var(--color-text);
}
.vf-entry-meta {
  font-size: 0.78rem;
  color: var(--color-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.2rem;
}
.vf-entry-author {
  color: var(--color-accent);
  text-decoration: none;
}
.vf-entry-vis {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-block);
  padding: 0 0.3rem;
}
.vf-entry-actions {
  display: flex;
  gap: 0.4rem;
  height: fit-content;
}
.vf-entry-body {
  margin-top: 0.75rem;
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 0.9rem;
}
.vf-comments {
  list-style: none;
  margin: 0;
  padding: 0;
}
.vf-comments > li {
  padding: 0.45rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
}
.vf-comment-author {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.82rem;
}
.vf-comment-when {
  margin-left: 0.4rem;
  font-size: 0.72rem;
  color: var(--color-muted);
}
.vf-comment-body {
  white-space: pre-wrap;
  font-size: 0.85rem;
  margin-top: 0.15rem;
}
.vf-comment-form {
  display: flex;
  gap: 0.4rem;
  align-items: flex-end;
  padding: 0.6rem;
}
.vf-comment-form textarea {
  flex: 1;
}
.vf-empty {
  padding: 0.5rem 0.6rem;
  color: var(--color-muted);
  font-style: italic;
  font-size: 0.85rem;
}
</style>
