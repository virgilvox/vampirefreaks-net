<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-3">
      <h1 class="vf-page-title">Cults</h1>
      <UiButton v-if="profile" @click="createOpen = true">Start a cult</UiButton>
    </div>

    <VfPanel flush>
      <ul class="vf-cults">
        <li v-for="c in cults" :key="c.slug">
          <NuxtLink :to="`/cults/${c.slug}`" class="vf-cult">
            <span class="vf-cult-mark" aria-hidden="true">&#10013;</span>
            <span class="vf-cult-main">
              <span class="vf-cult-name">{{ c.name }}</span>
              <span class="vf-cult-desc">{{ c.description || "No description." }}</span>
            </span>
            <span class="vf-cult-count"
              >{{ c.memberCount }} {{ c.memberCount === 1 ? "member" : "members" }}</span
            >
          </NuxtLink>
        </li>
        <li v-if="!cults || cults.length === 0" class="vf-empty">No cults yet. Start the first.</li>
      </ul>
    </VfPanel>

    <UiDialog
      v-model:open="createOpen"
      title="Start a cult"
      description="A group with its own page and roster."
    >
      <form class="flex flex-col gap-4" @submit.prevent="create">
        <UiFormField label="Name" for="c-name">
          <template #default="{ id }"><UiInput :id="id" v-model="form.name" required /></template>
        </UiFormField>
        <UiFormField label="Description" for="c-desc">
          <template #default="{ id }">
            <textarea
              :id="id"
              v-model="form.description"
              rows="4"
              class="jig-input w-full rounded-block border-2 border-border bg-surface px-3 py-2 text-text"
            />
          </template>
        </UiFormField>
        <UiFormField label="Who can join">
          <UiSelect v-model="form.joinPolicy" :options="policyOptions" />
        </UiFormField>
      </form>
      <template #footer>
        <UiButton variant="ghost" @click="createOpen = false">Cancel</UiButton>
        <UiButton :disabled="saving" @click="create">{{
          saving ? "Creating..." : "Create"
        }}</UiButton>
      </template>
    </UiDialog>
  </section>
</template>

<script setup lang="ts">
useHead({ title: "Cults" })
const { profile } = await useProfile()
const { push } = useToast()

type Cult = {
  slug: string
  name: string
  description: string
  memberCount: number
  joinPolicy: string
}
const { data: cults, refresh } = await useFetch<Cult[]>("/api/cults", { default: () => [] })

const policyOptions = [
  { label: "Anyone (open)", value: "open" },
  { label: "By approval", value: "approval" },
  { label: "Closed (invite only)", value: "closed" },
]

const createOpen = ref(false)
const saving = ref(false)
const form = reactive({ name: "", description: "", joinPolicy: "open" })

async function create(): Promise<void> {
  if (!form.name.trim()) return
  saving.value = true
  try {
    const res = await $fetch<{ slug: string }>("/api/cults", { method: "POST", body: { ...form } })
    createOpen.value = false
    form.name = ""
    form.description = ""
    await refresh()
    await navigateTo(`/cults/${res.slug}`)
  } catch {
    push({ title: "Could not create cult", variant: "danger" })
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
.vf-cults {
  list-style: none;
  margin: 0;
  padding: 0;
}
.vf-cult {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.7rem;
  border-bottom: 1px solid var(--color-border);
  text-decoration: none;
  color: var(--color-text);
}
.vf-cults li:last-child .vf-cult {
  border-bottom: none;
}
.vf-cult:hover {
  background: var(--color-surface-2);
}
.vf-cult-mark {
  color: var(--color-accent);
}
.vf-cult-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.vf-cult-name {
  font-weight: 700;
  color: var(--color-accent);
}
.vf-cult-desc {
  font-size: 0.8rem;
  color: var(--color-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vf-cult-count {
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
