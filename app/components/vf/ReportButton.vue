<template>
  <span class="vf-report">
    <button type="button" class="vf-report-trigger" @click="open = true">{{ label }}</button>

    <UiDialog
      v-model:open="open"
      title="Report to staff"
      description="Tell us what is wrong with this."
    >
      <UiFormField label="Reason" for="report-reason">
        <template #default="{ id }">
          <textarea
            :id="id"
            v-model="reason"
            rows="3"
            class="jig-input w-full rounded-block border-2 border-border bg-surface px-3 py-2 text-text"
            placeholder="What should staff know?"
          />
        </template>
      </UiFormField>
      <template #footer>
        <UiButton variant="ghost" @click="open = false">Cancel</UiButton>
        <UiButton variant="danger" :disabled="sending || !reason.trim()" @click="submit">
          {{ sending ? "Sending..." : "Report" }}
        </UiButton>
      </template>
    </UiDialog>
  </span>
</template>

<script setup lang="ts">
import { ref } from "vue"

const props = withDefaults(
  defineProps<{ targetType: string; targetId: string; label?: string }>(),
  { label: "Report" },
)
const { push } = useToast()

const open = ref(false)
const reason = ref("")
const sending = ref(false)

async function submit(): Promise<void> {
  if (!reason.value.trim()) return
  sending.value = true
  try {
    await $fetch("/api/reports", {
      method: "POST",
      body: { targetType: props.targetType, targetId: props.targetId, reason: reason.value },
    })
    open.value = false
    reason.value = ""
    push({ title: "Reported. Staff will take a look." })
  } catch {
    push({ title: "Could not send the report", variant: "danger" })
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.vf-report-trigger {
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.72rem;
  color: var(--color-muted);
}
.vf-report-trigger:hover {
  color: var(--color-danger);
}
</style>
