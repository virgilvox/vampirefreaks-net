<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="vf-crumb"><NuxtLink to="/forum">Messageboard</NuxtLink> /</p>
        <h1 class="vf-page-title">{{ data.board?.name || boardSlug }}</h1>
        <p v-if="data.board?.description" class="vf-board-desc">{{ data.board.description }}</p>
      </div>
      <UiButton v-if="profile" @click="newOpen = true">New thread</UiButton>
    </div>

    <VfPanel flush>
      <ul class="vf-threads">
        <li v-for="t in data.threads" :key="t.id">
          <NuxtLink :to="`/forum/${boardSlug}/${t.id}`" class="vf-thread">
            <span v-if="t.pinned" class="vf-badge" title="Pinned">pinned</span>
            <span v-if="t.locked" class="vf-badge vf-badge-muted" title="Locked">locked</span>
            <span class="vf-thread-title">{{ t.title }}</span>
            <span class="vf-thread-meta"
              >{{ t.displayName || t.username }} · {{ t.postCount }} posts</span
            >
          </NuxtLink>
        </li>
        <li v-if="data.threads.length === 0" class="vf-empty">No threads yet. Start one.</li>
      </ul>
    </VfPanel>

    <UiDialog
      v-model:open="newOpen"
      title="New thread"
      :description="`Post to ${data.board?.name || boardSlug}.`"
    >
      <form class="flex flex-col gap-4" @submit.prevent="create">
        <UiFormField label="Title" for="t-title">
          <template #default="{ id }"><UiInput :id="id" v-model="form.title" required /></template>
        </UiFormField>
        <UiFormField label="First post" for="t-body">
          <template #default="{ id }">
            <textarea
              :id="id"
              v-model="form.body"
              rows="6"
              class="jig-input w-full rounded-block border-2 border-border bg-surface px-3 py-2 text-text"
            />
          </template>
        </UiFormField>
      </form>
      <template #footer>
        <UiButton variant="ghost" @click="newOpen = false">Cancel</UiButton>
        <UiButton :disabled="saving" @click="create">{{
          saving ? "Posting..." : "Post thread"
        }}</UiButton>
      </template>
    </UiDialog>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
const boardSlug = computed(() => String(route.params.boardSlug))
const { push } = useToast()
const { profile } = await useProfile()

type Thread = {
  id: string
  title: string
  pinned: boolean
  locked: boolean
  postCount: number
  username: string
  displayName: string | null
}
type BoardData = {
  board: { name: string; slug: string; description: string } | null
  threads: Thread[]
}

const { data } = await useFetch<BoardData>(() => `/api/boards/${boardSlug.value}/threads`, {
  default: () => ({ board: null, threads: [] }),
})
useHead(() => ({ title: data.value?.board?.name || "Board" }))

const newOpen = ref(false)
const saving = ref(false)
const form = reactive({ title: "", body: "" })

async function create(): Promise<void> {
  if (!form.title.trim() || !form.body.trim()) return
  saving.value = true
  try {
    const res = await $fetch<{ id: string; boardSlug: string }>("/api/threads", {
      method: "POST",
      body: { boardSlug: boardSlug.value, title: form.title, body: form.body },
    })
    newOpen.value = false
    form.title = ""
    form.body = ""
    await navigateTo(`/forum/${res.boardSlug}/${res.id}`)
  } catch {
    push({ title: "Could not post thread", variant: "danger" })
  } finally {
    saving.value = false
  }
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
  font-size: 1.8rem;
  color: var(--color-text);
}
.vf-board-desc {
  font-size: 0.82rem;
  color: var(--color-muted);
}
.vf-threads {
  list-style: none;
  margin: 0;
  padding: 0;
}
.vf-thread {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.5rem 0.7rem;
  border-bottom: 1px solid var(--color-border);
  text-decoration: none;
  color: var(--color-text);
}
.vf-threads li:last-child .vf-thread {
  border-bottom: none;
}
.vf-thread:hover {
  background: var(--color-surface-2);
}
.vf-thread-title {
  flex: 1;
  color: var(--color-accent);
}
.vf-thread-meta {
  font-size: 0.74rem;
  color: var(--color-muted);
  white-space: nowrap;
}
.vf-badge {
  font-size: 0.62rem;
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
.vf-empty {
  padding: 0.6rem;
  color: var(--color-muted);
  font-style: italic;
}
</style>
