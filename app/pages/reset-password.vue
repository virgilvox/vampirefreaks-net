<template>
  <UiCard title="Set a new password">
    <form v-if="token" class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <UiFormField label="New password" for="reset-password" hint="At least 8 characters.">
        <template #default="{ id }">
          <UiInput
            :id="id"
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
          />
        </template>
      </UiFormField>
      <UiButton type="submit" block :disabled="loading">
        {{ loading ? "Saving..." : "Save password" }}
      </UiButton>
    </form>

    <p v-else class="text-danger">This reset link is missing its token. Request a new one.</p>

    <template #footer>
      <NuxtLink to="/login" class="text-sm text-accent underline">Back to log in</NuxtLink>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
definePageMeta({ layout: "auth" })
useHead({ title: "Set new password" })

const route = useRoute()
const token = computed<string>(() => String(route.query.token ?? ""))
const password = ref("")
const loading = ref(false)
const { push } = useToast()

async function onSubmit(): Promise<void> {
  loading.value = true
  const { error } = await authClient.resetPassword({
    newPassword: password.value,
    token: token.value,
  })
  loading.value = false
  if (error) {
    push({
      title: "Could not reset",
      description: error.message ?? "Try again.",
      variant: "danger",
    })
    return
  }
  push({ title: "Password updated", description: "Log in with your new password." })
  await navigateTo("/login")
}
</script>
