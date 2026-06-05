<template>
  <UiDialog
    v-model:open="openModel"
    title="Update status"
    description="A line for your feed and profile."
  >
    <textarea
      v-model="text"
      rows="3"
      maxlength="500"
      class="jig-input w-full rounded-block border-2 border-border bg-surface px-3 py-2 text-text"
      placeholder="What's on your mind?"
    />
    <template #footer>
      <UiButton variant="ghost" @click="openModel = false">Cancel</UiButton>
      <UiButton :disabled="posting || !text.trim()" @click="post">{{
        posting ? "Posting..." : "Post"
      }}</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { ref } from "vue"

const openModel = defineModel<boolean>("open", { default: false })
const emit = defineEmits<{ posted: [] }>()
const { push } = useToast()

const text = ref("")
const posting = ref(false)

async function post(): Promise<void> {
  if (!text.value.trim()) return
  posting.value = true
  try {
    await $fetch("/api/status", { method: "POST", body: { body: text.value } })
    text.value = ""
    push({ title: "Status posted" })
    emit("posted")
  } catch {
    push({ title: "Could not post status", variant: "danger" })
  } finally {
    posting.value = false
  }
}
</script>
