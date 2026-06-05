<template>
  <section class="flex flex-col gap-6">
    <h1 class="vf-page-title">Friend requests</h1>

    <UiCard title="Waiting on you">
      <p v-if="data.incoming.length === 0" class="text-muted">No incoming requests.</p>
      <ul v-else class="vf-req-list">
        <li v-for="r in data.incoming" :key="r.id">
          <NuxtLink :to="`/${r.otherUsername}`" class="vf-req-name">{{
            r.otherDisplayName || r.otherUsername
          }}</NuxtLink>
          <span class="vf-req-actions">
            <UiButton @click="respond(r.otherUsername, 'accept')">Accept</UiButton>
            <UiButton variant="ghost" @click="respond(r.otherUsername, 'decline')"
              >Decline</UiButton
            >
          </span>
        </li>
      </ul>
    </UiCard>

    <UiCard title="Sent">
      <p v-if="data.outgoing.length === 0" class="text-muted">No pending requests sent.</p>
      <ul v-else class="vf-req-list">
        <li v-for="r in data.outgoing" :key="r.id">
          <NuxtLink :to="`/${r.otherUsername}`" class="vf-req-name">{{
            r.otherDisplayName || r.otherUsername
          }}</NuxtLink>
          <UiButton variant="ghost" @click="cancel(r.otherUsername)">Cancel</UiButton>
        </li>
      </ul>
    </UiCard>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "onboarded" })
useHead({ title: "Friend requests" })

type Req = { id: string; otherUsername: string; otherDisplayName: string | null }
type FriendData = { friends: Req[]; incoming: Req[]; outgoing: Req[] }

const cookieHeaders = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
const { data, refresh } = await useFetch<FriendData>("/api/friends", {
  default: () => ({ friends: [], incoming: [], outgoing: [] }),
  headers: cookieHeaders,
})

async function respond(username: string, action: "accept" | "decline"): Promise<void> {
  await $fetch(`/api/friends/${username}/respond`, { method: "POST", body: { action } }).catch(
    () => null,
  )
  await refresh()
}
async function cancel(username: string): Promise<void> {
  await $fetch(`/api/friends/${username}`, { method: "DELETE" }).catch(() => null)
  await refresh()
}
</script>

<style scoped>
.vf-req-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.vf-req-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--color-border);
}
.vf-req-name {
  color: var(--color-text);
  text-decoration: none;
}
.vf-req-name:hover {
  color: var(--color-accent);
}
.vf-req-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
