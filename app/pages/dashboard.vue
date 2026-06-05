<template>
  <section class="flex flex-col gap-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl font-bold">Your notes</h1>
        <p class="text-muted">Signed in as {{ user?.email }}.</p>
      </div>
      <UiButton @click="openCreate">New note</UiButton>
    </div>

    <p v-if="notes && notes.length === 0" class="text-muted">
      No notes yet. Create one to see the pattern, or run
      <code class="font-mono">npm run db:seed</code>.
    </p>

    <UiTable v-else :columns="['Done', 'Title', 'Category', '']">
      <tr v-for="note in notes" :key="note.id">
        <td>
          <input
            type="checkbox"
            :checked="note.done"
            :aria-label="`Mark ${note.title} done`"
            @change="toggleDone(note)"
          />
        </td>
        <td>
          <span :class="note.done ? 'text-muted line-through' : ''">{{ note.title }}</span>
          <p v-if="note.body" class="text-sm text-muted">{{ note.body }}</p>
        </td>
        <td class="text-muted">{{ categoryName(note.categoryId) }}</td>
        <td class="text-right">
          <UiButton variant="ghost" @click="remove(note)">Delete</UiButton>
        </td>
      </tr>
    </UiTable>

    <UiDialog v-model:open="dialogOpen" title="New note" description="Add a note to your list.">
      <form class="flex flex-col gap-4" @submit.prevent="create">
        <UiFormField label="Title" for="note-title">
          <template #default="{ id }">
            <UiInput :id="id" v-model="form.title" required />
          </template>
        </UiFormField>

        <UiFormField label="Body" for="note-body">
          <template #default="{ id }">
            <UiInput :id="id" v-model="form.body" placeholder="Optional" />
          </template>
        </UiFormField>

        <UiFormField label="Category">
          <UiSelect v-model="form.categoryId" :options="categoryOptions" placeholder="None" />
        </UiFormField>
      </form>

      <template #footer>
        <UiButton variant="ghost" @click="dialogOpen = false">Cancel</UiButton>
        <UiButton :disabled="saving" @click="create">{{ saving ? "Saving..." : "Save" }}</UiButton>
      </template>
    </UiDialog>
  </section>
</template>

<script setup lang="ts">
import type { Category, Note } from "../../server/db/schema"

definePageMeta({ middleware: "auth" })
useHead({ title: "Dashboard" })

const { user } = await useCurrentUser()
const { push } = useToast()

const { data: notes, refresh: refreshNotes } = await useFetch<Note[]>("/api/notes")
const { data: categories } = await useFetch<Category[]>("/api/categories")

const dialogOpen = ref(false)
const saving = ref(false)
const form = reactive({ title: "", body: "", categoryId: "" })

// Reka Select forbids an empty-string item value, so "none" is the sentinel
// for no category. It maps back to null on save.
const NO_CATEGORY = "none"

const categoryOptions = computed(() => [
  { label: "None", value: NO_CATEGORY },
  ...(categories.value ?? []).map((c) => ({ label: c.name, value: c.id })),
])

function categoryName(id: string | null): string {
  if (!id) return "—"
  return categories.value?.find((c) => c.id === id)?.name ?? "—"
}

function openCreate(): void {
  form.title = ""
  form.body = ""
  form.categoryId = ""
  dialogOpen.value = true
}

async function create(): Promise<void> {
  if (!form.title.trim()) return
  saving.value = true
  const categoryId = form.categoryId && form.categoryId !== NO_CATEGORY ? form.categoryId : null
  try {
    await $fetch("/api/notes", {
      method: "POST",
      body: { title: form.title, body: form.body, categoryId },
    })
    dialogOpen.value = false
    await refreshNotes()
  } catch {
    push({ title: "Could not save note", variant: "danger" })
  } finally {
    saving.value = false
  }
}

async function toggleDone(note: Note): Promise<void> {
  await $fetch(`/api/notes/${note.id}`, { method: "PATCH", body: { done: !note.done } })
  await refreshNotes()
}

async function remove(note: Note): Promise<void> {
  await $fetch(`/api/notes/${note.id}`, { method: "DELETE" })
  await refreshNotes()
}
</script>
