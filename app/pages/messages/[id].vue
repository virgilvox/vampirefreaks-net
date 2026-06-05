<template>
  <section v-if="message" class="mx-auto flex max-w-2xl flex-col gap-4">
    <NuxtLink to="/messages" class="text-sm text-muted">&larr; Inbox</NuxtLink>
    <UiCard :title="message.subject || '(no subject)'">
      <template #header>
        <h2 class="font-display text-lg font-semibold">{{ message.subject || "(no subject)" }}</h2>
        <p class="text-sm text-muted">{{ direction }} · {{ date(message.createdAt) }}</p>
      </template>
      <p class="vf-body">{{ message.body }}</p>
      <template v-if="other" #footer>
        <UiButton @click="replyOpen = true">Reply</UiButton>
      </template>
    </UiCard>

    <UiDialog
      v-model:open="replyOpen"
      :title="`Reply to ${other}`"
      description="Sends to their inbox."
    >
      <UiFormField label="Message" for="reply-body">
        <template #default="{ id }"><UiInput :id="id" v-model="replyBody" required /></template>
      </UiFormField>
      <template #footer>
        <UiButton variant="ghost" @click="replyOpen = false">Cancel</UiButton>
        <UiButton :disabled="sending" @click="reply">{{
          sending ? "Sending..." : "Send"
        }}</UiButton>
      </template>
    </UiDialog>
  </section>

  <section v-else class="py-16 text-center text-muted">No such message.</section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "onboarded" })

const route = useRoute()
const { push } = useToast()
const { profile } = await useProfile()

type Msg = {
  id: string
  senderId: string
  recipientId: string
  subject: string | null
  body: string
  createdAt: string
  senderUsername: string | null
  recipientUsername: string | null
}

const { data: message } = await useFetch<Msg | null>(`/api/messages/${route.params.id}`, {
  default: () => null,
})

useHead(() => ({ title: message.value?.subject || "Message" }))

const sentByMe = computed(() => message.value?.senderId === profile.value?.userId)
const direction = computed(() => (sentByMe.value ? "you sent this" : "to you"))

function date(v: string): string {
  return new Date(v).toLocaleString()
}

// Reply targets whichever party is not the viewer.
const other = computed<string | null>(() =>
  sentByMe.value
    ? (message.value?.recipientUsername ?? null)
    : (message.value?.senderUsername ?? null),
)

const replyOpen = ref(false)
const replyBody = ref("")
const sending = ref(false)

async function reply(): Promise<void> {
  if (!replyBody.value.trim() || !other.value) return
  sending.value = true
  try {
    await $fetch("/api/messages", {
      method: "POST",
      body: { to: other.value, body: replyBody.value },
    })
    replyOpen.value = false
    replyBody.value = ""
    push({ title: "Reply sent" })
  } catch {
    push({ title: "Could not send reply", variant: "danger" })
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.vf-body {
  white-space: pre-wrap;
  line-height: 1.6;
}
</style>
