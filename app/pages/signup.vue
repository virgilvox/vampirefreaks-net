<template>
  <UiCard title="Create account" subtitle="One minute and you are in.">
    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <UiFormField label="Name" for="signup-name">
        <template #default="{ id }">
          <UiInput :id="id" v-model="name" autocomplete="name" required />
        </template>
      </UiFormField>

      <UiFormField label="Email" for="signup-email">
        <template #default="{ id }">
          <UiInput :id="id" v-model="email" type="email" autocomplete="email" required />
        </template>
      </UiFormField>

      <UiFormField label="Password" for="signup-password" hint="At least 8 characters.">
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
        {{ loading ? "Creating..." : "Create account" }}
      </UiButton>
    </form>

    <template #footer>
      <p class="text-sm text-muted">
        Already have an account?
        <NuxtLink to="/login" class="text-accent underline">Log in</NuxtLink>
      </p>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
definePageMeta({ layout: "auth" })
useHead({ title: "Sign up" })

const name = ref("")
const email = ref("")
const password = ref("")
const loading = ref(false)
const { push } = useToast()

async function onSubmit(): Promise<void> {
  loading.value = true
  const { data, error } = await authClient.signUp.email({
    name: name.value,
    email: email.value,
    password: password.value,
  })
  loading.value = false
  if (error) {
    push({
      title: "Could not sign up",
      description: error.message ?? "Check your details.",
      variant: "danger",
    })
    return
  }
  await refreshNuxtData("current-session")
  // A token means auto sign-in happened. No token means verification is
  // required, so send them to confirm their address instead of the dashboard.
  if (data?.token) {
    await navigateTo("/dashboard")
  } else {
    await navigateTo(`/verify-email?email=${encodeURIComponent(email.value)}`)
  }
}
</script>
