<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-3">
      <h1 class="vf-page-title">Events</h1>
      <UiButton v-if="profile" @click="createOpen = true">Post an event</UiButton>
    </div>

    <div class="vf-filter">
      <UiInput v-model="city" placeholder="Filter by city" />
      <UiButton v-if="city" variant="ghost" @click="city = ''">Clear</UiButton>
    </div>

    <VfPanel title="Upcoming" flush>
      <ul v-if="data.upcoming.length" class="vf-events">
        <li v-for="e in data.upcoming" :key="e.id">
          <NuxtLink :to="`/events/${e.id}`" class="vf-event">
            <span class="vf-event-date">{{ shortDate(e.startsAt) }}</span>
            <span class="vf-event-main">
              <span class="vf-event-title">{{ e.title }}</span>
              <span class="vf-event-where">{{
                [e.venue, e.city].filter(Boolean).join(", ") || "TBA"
              }}</span>
            </span>
            <span class="vf-event-going">{{ e.goingCount }} going</span>
          </NuxtLink>
        </li>
      </ul>
      <p v-else class="vf-empty">No upcoming events.</p>
    </VfPanel>

    <VfPanel v-if="data.past.length" title="Past" flush>
      <ul class="vf-events">
        <li v-for="e in data.past" :key="e.id">
          <NuxtLink :to="`/events/${e.id}`" class="vf-event vf-event-past">
            <span class="vf-event-date">{{ shortDate(e.startsAt) }}</span>
            <span class="vf-event-main">
              <span class="vf-event-title">{{ e.title }}</span>
              <span class="vf-event-where">{{
                [e.venue, e.city].filter(Boolean).join(", ") || ""
              }}</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </VfPanel>

    <UiDialog
      v-model:open="createOpen"
      title="Post an event"
      description="A club night, festival, or show."
    >
      <form class="flex flex-col gap-4" @submit.prevent="create">
        <UiFormField label="Title" for="e-title">
          <template #default="{ id }"><UiInput :id="id" v-model="form.title" required /></template>
        </UiFormField>
        <div class="flex flex-wrap gap-4">
          <UiFormField label="Starts" for="e-start">
            <template #default="{ id }"
              ><UiInput :id="id" v-model="form.startsAt" type="datetime-local" required
            /></template>
          </UiFormField>
          <UiFormField label="Ends" for="e-end">
            <template #default="{ id }"
              ><UiInput :id="id" v-model="form.endsAt" type="datetime-local"
            /></template>
          </UiFormField>
        </div>
        <div class="flex flex-wrap gap-4">
          <UiFormField label="Venue" for="e-venue">
            <template #default="{ id }"><UiInput :id="id" v-model="form.venue" /></template>
          </UiFormField>
          <UiFormField label="City" for="e-city">
            <template #default="{ id }"><UiInput :id="id" v-model="form.city" /></template>
          </UiFormField>
        </div>
        <UiFormField label="Link" for="e-url">
          <template #default="{ id }"
            ><UiInput :id="id" v-model="form.url" placeholder="Optional"
          /></template>
        </UiFormField>
        <UiFormField label="Details" for="e-desc">
          <template #default="{ id }">
            <textarea
              :id="id"
              v-model="form.description"
              rows="4"
              class="jig-input w-full rounded-block border-2 border-border bg-surface px-3 py-2 text-text"
            />
          </template>
        </UiFormField>
      </form>
      <template #footer>
        <UiButton variant="ghost" @click="createOpen = false">Cancel</UiButton>
        <UiButton :disabled="saving" @click="create">{{ saving ? "Posting..." : "Post" }}</UiButton>
      </template>
    </UiDialog>
  </section>
</template>

<script setup lang="ts">
useHead({ title: "Events" })
const { profile } = await useProfile()
const { push } = useToast()

type EventRow = {
  id: string
  title: string
  venue: string | null
  city: string | null
  startsAt: string
  goingCount: number
}
type EventList = { upcoming: EventRow[]; past: EventRow[] }

const city = ref("")
const { data } = await useFetch<EventList>(
  () => `/api/events${city.value.trim() ? `?city=${encodeURIComponent(city.value.trim())}` : ""}`,
  { watch: [city], default: () => ({ upcoming: [], past: [] }) },
)

function shortDate(v: string): string {
  return new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const createOpen = ref(false)
const saving = ref(false)
const form = reactive({
  title: "",
  startsAt: "",
  endsAt: "",
  venue: "",
  city: "",
  url: "",
  description: "",
})

async function create(): Promise<void> {
  if (!form.title.trim() || !form.startsAt) return
  saving.value = true
  try {
    const created = await $fetch<{ id: string }>("/api/events", {
      method: "POST",
      body: { ...form },
    })
    createOpen.value = false
    await navigateTo(`/events/${created.id}`)
  } catch {
    push({ title: "Could not post the event", variant: "danger" })
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
.vf-filter {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  max-width: 22rem;
}
.vf-events {
  list-style: none;
  margin: 0;
  padding: 0;
}
.vf-event {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.5rem 0.7rem;
  border-bottom: 1px solid var(--color-border);
  text-decoration: none;
  color: var(--color-text);
}
.vf-events li:last-child .vf-event {
  border-bottom: none;
}
.vf-event:hover {
  background: var(--color-surface-2);
}
.vf-event-past {
  opacity: 0.6;
}
.vf-event-date {
  font-family: var(--font-display);
  color: var(--color-accent);
  width: 3.5rem;
  flex-shrink: 0;
}
.vf-event-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.vf-event-title {
  font-weight: 700;
}
.vf-event-where {
  font-size: 0.78rem;
  color: var(--color-muted);
}
.vf-event-going {
  font-size: 0.74rem;
  color: var(--color-muted);
  white-space: nowrap;
}
.vf-empty {
  padding: 0.6rem;
  color: var(--color-muted);
  font-style: italic;
}
</style>
