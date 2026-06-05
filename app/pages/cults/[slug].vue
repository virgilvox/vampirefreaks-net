<template>
  <section v-if="cult" class="flex flex-col gap-3">
    <div class="vf-cult-head">
      <div>
        <h1 class="vf-cult-title">{{ cult.name }}</h1>
        <p class="vf-cult-meta">
          {{ cult.memberCount }} {{ cult.memberCount === 1 ? "member" : "members" }} ·
          {{ policyLabel }}
          <template v-if="cult.ownerUsername">
            · run by
            <NuxtLink :to="`/${cult.ownerUsername}`" class="vf-link">{{
              cult.ownerUsername
            }}</NuxtLink>
          </template>
        </p>
      </div>
      <div class="vf-cult-actions">
        <UiButton v-if="canJoin" :disabled="busy" @click="join">
          {{ cult.joinPolicy === "approval" ? "Request to join" : "Join" }}
        </UiButton>
        <UiButton v-else-if="viewerStatus === 'pending'" variant="ghost" disabled
          >Request pending</UiButton
        >
        <UiButton
          v-else-if="viewerStatus === 'active' && !isOwner"
          variant="ghost"
          :disabled="busy"
          @click="leave"
        >
          Leave
        </UiButton>
        <NuxtLink v-else-if="!profile" to="/login"
          ><UiButton variant="surface">Log in to join</UiButton></NuxtLink
        >
      </div>
    </div>

    <VfPanel v-if="cult.description" title="About" flush>
      <p class="vf-cult-about">{{ cult.description }}</p>
    </VfPanel>

    <VfPanel v-if="cult.pending.length" title="Pending requests" flush>
      <ul class="vf-roster">
        <li v-for="m in cult.pending" :key="m.username">
          <NuxtLink :to="`/${m.username}`" class="vf-link">{{
            m.displayName || m.username
          }}</NuxtLink>
          <span class="vf-roster-actions">
            <UiButton @click="manage(m.username, 'approve')">Approve</UiButton>
            <UiButton variant="ghost" @click="manage(m.username, 'remove')">Decline</UiButton>
          </span>
        </li>
      </ul>
    </VfPanel>

    <VfPanel :title="`Members (${cult.members.length})`" flush>
      <ul class="vf-roster">
        <li v-for="m in cult.members" :key="m.username">
          <NuxtLink :to="`/${m.username}`" class="vf-link">{{
            m.displayName || m.username
          }}</NuxtLink>
          <span class="vf-roster-role">{{ m.role }}</span>
          <span v-if="isOwner && m.role !== 'owner'" class="vf-roster-actions">
            <UiButton
              variant="ghost"
              @click="manage(m.username, m.role === 'moderator' ? 'demote' : 'promote')"
            >
              {{ m.role === "moderator" ? "Demote" : "Make mod" }}
            </UiButton>
            <UiButton variant="ghost" @click="manage(m.username, 'remove')">Remove</UiButton>
          </span>
        </li>
      </ul>
    </VfPanel>
  </section>

  <section v-else class="py-16 text-center text-muted">No such cult.</section>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug))
const { push } = useToast()
const { profile } = await useProfile()

type Member = { username: string; displayName: string | null; role: string; status: string }
type Cult = {
  slug: string
  name: string
  description: string
  joinPolicy: string
  memberCount: number
  ownerUsername: string | null
  members: Member[]
  pending: Member[]
  viewerMembership: { role: string; status: string } | null
}

const cookieHeaders = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
const { data: cult, refresh } = await useFetch<Cult | null>(() => `/api/cults/${slug.value}`, {
  default: () => null,
  headers: cookieHeaders,
})
useHead(() => ({ title: cult.value?.name || "Cult" }))

const viewerStatus = computed(() => cult.value?.viewerMembership?.status ?? null)
const isOwner = computed(() => cult.value?.viewerMembership?.role === "owner")
const canJoin = computed(
  () => Boolean(profile.value) && !viewerStatus.value && cult.value?.joinPolicy !== "closed",
)
const policyLabel = computed(() => {
  const p = cult.value?.joinPolicy
  return p === "approval" ? "by approval" : p === "closed" ? "closed" : "open"
})

const busy = ref(false)
async function join(): Promise<void> {
  busy.value = true
  try {
    await $fetch(`/api/cults/${slug.value}/join`, { method: "POST" })
    await refresh()
  } catch {
    push({ title: "Could not join", variant: "danger" })
  } finally {
    busy.value = false
  }
}
async function leave(): Promise<void> {
  busy.value = true
  try {
    await $fetch(`/api/cults/${slug.value}/leave`, { method: "POST" })
    await refresh()
  } finally {
    busy.value = false
  }
}
async function manage(username: string, action: string): Promise<void> {
  await $fetch(`/api/cults/${slug.value}/members/${username}`, {
    method: "POST",
    body: { action },
  }).catch(() => null)
  await refresh()
}
</script>

<style scoped>
.vf-cult-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.vf-cult-title {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--color-accent);
}
.vf-cult-meta {
  font-size: 0.8rem;
  color: var(--color-muted);
}
.vf-link {
  color: var(--color-accent);
  text-decoration: none;
}
.vf-link:hover {
  text-decoration: underline;
}
.vf-cult-about {
  white-space: pre-wrap;
  font-size: 0.88rem;
  line-height: 1.55;
}
.vf-roster {
  list-style: none;
  margin: 0;
  padding: 0;
}
.vf-roster > li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.85rem;
}
.vf-roster > li:last-child {
  border-bottom: none;
}
.vf-roster-role {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}
.vf-roster-actions {
  margin-left: auto;
  display: flex;
  gap: 0.4rem;
}
</style>
