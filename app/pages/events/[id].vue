<template>
  <section v-if="ev" class="flex flex-col gap-3">
    <p class="vf-crumb"><NuxtLink to="/events">Events</NuxtLink> /</p>

    <div class="vf-event-head">
      <div>
        <h1 class="vf-event-title">{{ ev.title }}</h1>
        <p class="vf-event-meta">
          {{ longDate(ev.startsAt)
          }}<template v-if="ev.endsAt"> to {{ longDate(ev.endsAt) }}</template>
        </p>
        <p v-if="ev.venue || ev.city" class="vf-event-meta">
          {{ [ev.venue, ev.city].filter(Boolean).join(", ") }}
        </p>
        <p v-if="ev.creatorUsername" class="vf-event-meta">
          posted by
          <NuxtLink :to="`/${ev.creatorUsername}`" class="vf-link">{{
            ev.creatorUsername
          }}</NuxtLink>
        </p>
      </div>
      <div v-if="ev.isEditor" class="vf-event-actions">
        <UiButton variant="danger" @click="remove">Delete</UiButton>
      </div>
    </div>

    <div class="vf-rsvp">
      <template v-if="profile">
        <UiButton
          :variant="ev.viewerRsvp === 'going' ? 'accent' : 'surface'"
          @click="rsvp('going')"
        >
          Going ({{ ev.goingCount }})
        </UiButton>
        <UiButton
          :variant="ev.viewerRsvp === 'interested' ? 'accent' : 'surface'"
          @click="rsvp('interested')"
        >
          Interested ({{ ev.interestedCount }})
        </UiButton>
      </template>
      <template v-else>
        <span class="vf-event-meta"
          >{{ ev.goingCount }} going, {{ ev.interestedCount }} interested</span
        >
      </template>
    </div>

    <VfPanel v-if="ev.description" title="Details">
      <p class="vf-event-desc">{{ ev.description }}</p>
    </VfPanel>

    <p v-if="ev.url">
      <a :href="ev.url" target="_blank" rel="noopener" class="vf-link">{{ ev.url }}</a>
    </p>
  </section>

  <section v-else class="py-16 text-center text-muted">No such event.</section>
</template>

<script setup lang="ts">
const route = useRoute()
const id = String(route.params.id)
const { profile } = await useProfile()

type Ev = {
  id: string
  title: string
  description: string
  venue: string | null
  city: string | null
  startsAt: string
  endsAt: string | null
  url: string | null
  creatorUsername: string | null
  goingCount: number
  interestedCount: number
  viewerRsvp: string | null
  isEditor: boolean
}

const cookieHeaders = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
const { data: ev, refresh } = await useFetch<Ev | null>(`/api/events/${id}`, {
  default: () => null,
  headers: cookieHeaders,
})
useHead(() => ({ title: ev.value?.title || "Event" }))

function longDate(v: string): string {
  return new Date(v).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

async function rsvp(status: "going" | "interested"): Promise<void> {
  // Clicking the active state again clears it.
  const next = ev.value?.viewerRsvp === status ? "none" : status
  await $fetch(`/api/events/${id}/rsvp`, { method: "PUT", body: { status: next } }).catch(
    () => null,
  )
  await refresh()
}

async function remove(): Promise<void> {
  await $fetch(`/api/events/${id}`, { method: "DELETE" }).catch(() => null)
  await navigateTo("/events")
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
.vf-event-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.vf-event-title {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--color-text);
}
.vf-event-meta {
  font-size: 0.82rem;
  color: var(--color-muted);
}
.vf-link {
  color: var(--color-accent);
  text-decoration: none;
}
.vf-link:hover {
  text-decoration: underline;
}
.vf-rsvp {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.vf-event-desc {
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 0.9rem;
}
</style>
