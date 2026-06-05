<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-3">
      <h1 class="vf-page-title">Music</h1>
      <UiButton v-if="profile" @click="createOpen = true">Add a band</UiButton>
    </div>

    <VfPanel flush>
      <ul class="vf-bands">
        <li v-for="b in bands" :key="b.slug">
          <NuxtLink :to="`/bands/${b.slug}`" class="vf-band">
            <span class="vf-band-mark" aria-hidden="true">&#9834;</span>
            <span class="vf-band-main">
              <span class="vf-band-name">{{ b.name }}</span>
              <span class="vf-band-meta">{{
                [b.genre, b.location].filter(Boolean).join(" · ")
              }}</span>
            </span>
          </NuxtLink>
        </li>
        <li v-if="!bands || bands.length === 0" class="vf-empty">No bands yet.</li>
      </ul>
    </VfPanel>

    <UiDialog
      v-model:open="createOpen"
      title="Add a band"
      description="Staff review it before it goes public."
    >
      <form class="flex flex-col gap-4" @submit.prevent="create">
        <UiFormField label="Name" for="b-name">
          <template #default="{ id }"><UiInput :id="id" v-model="form.name" required /></template>
        </UiFormField>
        <div class="flex flex-wrap gap-4">
          <UiFormField label="Genre" for="b-genre">
            <template #default="{ id }"><UiInput :id="id" v-model="form.genre" /></template>
          </UiFormField>
          <UiFormField label="Location" for="b-loc">
            <template #default="{ id }"><UiInput :id="id" v-model="form.location" /></template>
          </UiFormField>
        </div>
        <UiFormField label="About" for="b-bio">
          <template #default="{ id }">
            <textarea
              :id="id"
              v-model="form.bio"
              rows="4"
              class="jig-input w-full rounded-block border-2 border-border bg-surface px-3 py-2 text-text"
            />
          </template>
        </UiFormField>
      </form>
      <template #footer>
        <UiButton variant="ghost" @click="createOpen = false">Cancel</UiButton>
        <UiButton :disabled="saving" @click="create">{{
          saving ? "Submitting..." : "Submit"
        }}</UiButton>
      </template>
    </UiDialog>
  </section>
</template>

<script setup lang="ts">
useHead({ title: "Music" })
const { profile } = await useProfile()
const { push } = useToast()

type Band = { slug: string; name: string; genre: string | null; location: string | null }
const { data: bands, refresh } = await useFetch<Band[]>("/api/bands", { default: () => [] })

const createOpen = ref(false)
const saving = ref(false)
const form = reactive({ name: "", genre: "", location: "", bio: "" })

async function create(): Promise<void> {
  if (!form.name.trim()) return
  saving.value = true
  try {
    const res = await $fetch<{ slug: string }>("/api/bands", { method: "POST", body: { ...form } })
    createOpen.value = false
    await refresh()
    push({ title: "Submitted for review" })
    await navigateTo(`/bands/${res.slug}`)
  } catch {
    push({ title: "Could not add the band", variant: "danger" })
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
.vf-bands {
  list-style: none;
  margin: 0;
  padding: 0;
}
.vf-band {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.7rem;
  border-bottom: 1px solid var(--color-border);
  text-decoration: none;
  color: var(--color-text);
}
.vf-bands li:last-child .vf-band {
  border-bottom: none;
}
.vf-band:hover {
  background: var(--color-surface-2);
}
.vf-band-mark {
  color: var(--color-accent);
}
.vf-band-main {
  display: flex;
  flex-direction: column;
}
.vf-band-name {
  font-weight: 700;
  color: var(--color-accent);
}
.vf-band-meta {
  font-size: 0.78rem;
  color: var(--color-muted);
}
.vf-empty {
  padding: 0.6rem;
  color: var(--color-muted);
  font-style: italic;
}
</style>
