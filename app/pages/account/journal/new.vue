<template>
  <section class="mx-auto flex max-w-2xl flex-col gap-4">
    <h1 class="vf-page-title">{{ editing ? "Edit entry" : "New journal entry" }}</h1>

    <UiCard>
      <form class="flex flex-col gap-4" @submit.prevent="save">
        <UiFormField label="Title" for="j-title" :error="error">
          <template #default="{ id, invalid }">
            <UiInput :id="id" v-model="form.title" :invalid="invalid" required />
          </template>
        </UiFormField>

        <UiFormField label="Entry" for="j-body">
          <template #default="{ id }">
            <textarea
              :id="id"
              v-model="form.body"
              rows="12"
              class="jig-input w-full rounded-block border-2 border-border bg-surface px-3 py-2 text-text"
            />
          </template>
        </UiFormField>

        <div class="flex flex-wrap gap-4">
          <UiFormField label="Mood" for="j-mood">
            <template #default="{ id }"
              ><UiInput :id="id" v-model="form.mood" placeholder="Optional"
            /></template>
          </UiFormField>
          <UiFormField label="Who can see this">
            <UiSelect v-model="form.visibility" :options="visibilityOptions" />
          </UiFormField>
        </div>

        <div class="flex justify-end gap-2">
          <NuxtLink to="/journals"><UiButton variant="ghost">Cancel</UiButton></NuxtLink>
          <UiButton type="submit" :disabled="saving">{{
            saving ? "Saving..." : "Publish"
          }}</UiButton>
        </div>
      </form>
    </UiCard>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "onboarded" })

const route = useRoute()
const { push } = useToast()
const journalId = route.query.id ? String(route.query.id) : ""
const editing = computed(() => Boolean(journalId))
useHead(() => ({ title: editing.value ? "Edit entry" : "New entry" }))

const visibilityOptions = [
  { label: "Everyone", value: "public" },
  { label: "Friends only", value: "friends" },
  { label: "Just me", value: "private" },
]

const form = reactive({ title: "", body: "", mood: "", visibility: "public" })
const error = ref<string | undefined>()
const saving = ref(false)

// Load the existing entry when editing.
if (editing.value) {
  const existing = await $fetch<{
    title: string
    body: string
    mood: string | null
    visibility: string
  } | null>(`/api/journals/${journalId}`).catch(() => null)
  if (existing) {
    form.title = existing.title
    form.body = existing.body
    form.mood = existing.mood ?? ""
    form.visibility = existing.visibility
  }
}

async function save(): Promise<void> {
  error.value = undefined
  if (!form.title.trim()) {
    error.value = "A title is required"
    return
  }
  saving.value = true
  try {
    if (editing.value) {
      await $fetch(`/api/journals/${journalId}`, { method: "PATCH", body: { ...form } })
    } else {
      await $fetch("/api/journals", { method: "POST", body: { ...form } })
    }
    push({ title: editing.value ? "Entry updated" : "Entry published" })
    await navigateTo("/journals")
  } catch {
    push({ title: "Could not save entry", variant: "danger" })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.vf-page-title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  color: var(--color-text);
}
</style>
