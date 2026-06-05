<template>
  <section class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="font-display text-3xl font-bold">Sent</h1>
      <NuxtLink to="/messages"><UiButton variant="surface">Inbox</UiButton></NuxtLink>
    </div>

    <p v-if="messages && messages.length === 0" class="text-muted">Nothing sent yet.</p>

    <ul v-else class="vf-msg-list">
      <li v-for="m in messages" :key="m.id">
        <NuxtLink :to="`/messages/${m.id}`" class="vf-msg-row">
          <span class="vf-msg-from"
            >to {{ m.recipientDisplayName || m.recipientUsername || "unknown" }}</span
          >
          <span class="vf-msg-subject">{{ m.subject || "(no subject)" }}</span>
          <span class="vf-msg-date">{{ date(m.createdAt) }}</span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "onboarded" })
useHead({ title: "Sent" })

type SentRow = {
  id: string
  subject: string | null
  createdAt: string
  recipientUsername: string | null
  recipientDisplayName: string | null
}

const cookieHeaders = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
const { data: messages } = await useFetch<SentRow[]>("/api/messages/sent", {
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
.vf-msg-from {
  width: 12rem;
  flex-shrink: 0;
  color: var(--color-muted);
}
.vf-msg-subject {
  flex: 1;
}
.vf-msg-date {
  color: var(--color-muted);
  font-size: 0.8rem;
}
</style>
