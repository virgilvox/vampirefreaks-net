<template>
  <section v-if="thread" class="flex flex-col gap-3">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="vf-crumb">
          <NuxtLink to="/forum">Messageboard</NuxtLink> /
          <NuxtLink :to="`/forum/${thread.boardSlug}`">{{ thread.boardName }}</NuxtLink> /
        </p>
        <h1 class="vf-page-title">
          <span v-if="thread.pinned" class="vf-badge">pinned</span>
          <span v-if="thread.locked" class="vf-badge vf-badge-muted">locked</span>
          {{ thread.title }}
        </h1>
      </div>
      <div v-if="isStaff" class="vf-staff">
        <UiButton variant="surface" @click="toggle('pinned')">{{
          thread.pinned ? "Unpin" : "Pin"
        }}</UiButton>
        <UiButton variant="surface" @click="toggle('locked')">{{
          thread.locked ? "Unlock" : "Lock"
        }}</UiButton>
      </div>
    </div>

    <VfPanel flush>
      <ul class="vf-posts">
        <li v-for="p in thread.posts" :key="p.id" class="vf-post">
          <div class="vf-post-side">
            <NuxtLink :to="`/${p.username}`" class="vf-post-author">{{
              p.displayName || p.username
            }}</NuxtLink>
            <span class="vf-post-when">{{ when(p.createdAt) }}</span>
            <VfReportButton v-if="profile" target-type="post" :target-id="p.id" />
          </div>
          <div class="vf-post-body">{{ p.body }}</div>
        </li>
      </ul>
    </VfPanel>

    <VfPanel v-if="profile && !thread.locked" title="Reply" flush>
      <form class="vf-reply" @submit.prevent="reply">
        <textarea
          v-model="replyBody"
          rows="4"
          class="jig-input w-full rounded-block border-2 border-border bg-surface px-3 py-2 text-text"
          placeholder="Add to the thread"
        />
        <UiButton type="submit" :disabled="replying || !replyBody.trim()">Post reply</UiButton>
      </form>
    </VfPanel>
    <p v-else-if="thread.locked" class="vf-locked">This thread is locked.</p>
    <p v-else class="vf-locked">
      <NuxtLink to="/login" class="text-accent">Log in</NuxtLink> to reply.
    </p>
  </section>

  <section v-else class="py-16 text-center text-muted">No such thread.</section>
</template>

<script setup lang="ts">
const route = useRoute()
const threadId = String(route.params.threadId)
const { push } = useToast()
const { user } = await useCurrentUser()
const { profile } = await useProfile()
const isStaff = computed(() => (user.value as { role?: string } | null)?.role === "admin")

type Post = {
  id: string
  body: string
  createdAt: string
  username: string
  displayName: string | null
}
type Thread = {
  id: string
  title: string
  pinned: boolean
  locked: boolean
  postCount: number
  boardSlug: string
  boardName: string
  posts: Post[]
}

const { data: thread, refresh } = await useFetch<Thread | null>(`/api/threads/${threadId}`, {
  default: () => null,
})
useHead(() => ({ title: thread.value?.title || "Thread" }))

function when(v: string): string {
  return new Date(v).toLocaleString()
}

const replyBody = ref("")
const replying = ref(false)
async function reply(): Promise<void> {
  if (!replyBody.value.trim()) return
  replying.value = true
  try {
    await $fetch("/api/posts", { method: "POST", body: { threadId, body: replyBody.value } })
    replyBody.value = ""
    await refresh()
  } catch {
    push({ title: "Could not post reply", variant: "danger" })
  } finally {
    replying.value = false
  }
}

async function toggle(field: "pinned" | "locked"): Promise<void> {
  if (!thread.value) return
  await $fetch(`/api/threads/${threadId}`, {
    method: "PATCH",
    body: { [field]: !thread.value[field] },
  }).catch(() => null)
  await refresh()
}
</script>

<style scoped>
.vf-crumb {
  font-size: 0.75rem;
  color: var(--color-muted);
}
.vf-crumb a {
  color: var(--color-muted);
  text-decoration: none;
}
.vf-crumb a:hover {
  color: var(--color-accent);
}
.vf-page-title {
  font-family: var(--font-display);
  font-size: 1.7rem;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.vf-staff {
  display: flex;
  gap: 0.4rem;
}
.vf-posts {
  list-style: none;
  margin: 0;
  padding: 0;
}
.vf-post {
  display: flex;
  gap: 0.8rem;
  padding: 0.7rem;
  border-bottom: 1px solid var(--color-border);
}
.vf-posts li:last-child {
  border-bottom: none;
}
.vf-post-side {
  width: 9rem;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.vf-post-author {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.85rem;
}
.vf-post-when {
  font-size: 0.7rem;
  color: var(--color-muted);
}
.vf-post-body {
  flex: 1;
  white-space: pre-wrap;
  line-height: 1.55;
  font-size: 0.88rem;
}
.vf-reply {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}
.vf-reply textarea {
  width: 100%;
}
.vf-locked {
  color: var(--color-muted);
  font-style: italic;
  font-size: 0.85rem;
}
.vf-badge {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: var(--color-accent);
  color: var(--color-accent-text);
  border-radius: var(--radius-block);
  padding: 0 0.3rem;
}
.vf-badge-muted {
  background: var(--color-surface-2);
  color: var(--color-muted);
}
</style>
