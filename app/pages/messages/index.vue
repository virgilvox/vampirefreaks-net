<template>
  <section class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="font-display text-3xl font-bold">Inbox</h1>
      <NuxtLink to="/messages/sent"><UiButton variant="surface">Sent</UiButton></NuxtLink>
    </div>

    <p v-if="messages && messages.length === 0" class="text-muted">No messages yet.</p>

    <ul v-else class="vf-msg-list">
      <li v-for="m in messages" :key="m.id" :class="{ 'vf-unread': !m.readAt }">
        <NuxtLink :to="`/messages/${m.id}`" class="vf-msg-row">
          <span class="vf-msg-from">{{
            m.senderDisplayName || m.senderUsername || "unknown"
          }}</span>
          <span class="vf-msg-subject">{{ m.subject || "(no subject)" }}</span>
          <span class="vf-msg-date">{{ date(m.createdAt) }}</span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "onboarded" })
useHead({ title: "Inbox" })

type InboxRow = {
  id: string
  subject: string | null
  readAt: string | null
  createdAt: string
  senderUsername: string | null
  senderDisplayName: string | null
}

const cookieHeaders = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
const { data: messages } = await useFetch<InboxRow[]>("/api/messages", {
  default: () => [],
  headers: cookieHeaders,
})

function date(v: string): string {
  return new Date(v).toLocaleString()
}
</script>

<style scoped>
.vf-msg-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-block);
}
.vf-msg-row {
  display: flex;
  gap: 1rem;
  align-items: baseline;
  padding: 0.6rem 0.9rem;
  text-decoration: none;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
}
.vf-msg-list li:last-child .vf-msg-row {
  border-bottom: none;
}
.vf-msg-row:hover {
  background: var(--color-surface-2);
}
.vf-unread .vf-msg-from {
  font-weight: 700;
  color: var(--color-accent);
}
.vf-msg-from {
  width: 10rem;
  flex-shrink: 0;
}
.vf-msg-subject {
  flex: 1;
}
.vf-msg-date {
  color: var(--color-muted);
  font-size: 0.8rem;
}
</style>
