<template>
  <UiCard title="Reset password" subtitle="We will email you a reset link.">
    <form v-if="!sent" class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <UiFormField label="Email" for="forgot-email">
        <template #default="{ id }">
          <UiInput :id="id" v-model="email" type="email" autocomplete="email" required />
        </template>
      </UiFormField>
      <UiButton type="submit" block :disabled="loading">
        {{ loading ? "Sending..." : "Send reset link" }}
      </UiButton>
    </form>

    <p v-else class="text-muted">
      If an account exists for {{ email }}, a reset link is on its way.
    </p>

    <template #footer>
      <NuxtLink to="/login" class="text-sm text-accent underline">Back to log in</NuxtLink>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
definePageMeta({ layout: "auth" })
useHead({ title: "Reset password" })

const email = ref("")
const loading = ref(false)
const sent = ref(false)
const { push } = useToast()

async function onSubmit(): Promise<void> {
  loading.value = true
  const { error } = await authClient.requestPasswordReset({
    email: email.value,
    redirectTo: "/reset-password",
  })
  loading.value = false
  if (error) {
    push({
      title: "Could not send link",
      description: error.message ?? "Try again.",
      variant: "danger",
    })
    return
  }
  sent.value = true
}
</script>
