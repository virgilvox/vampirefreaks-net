<template>
  <UiCard title="Log in" subtitle="Welcome back.">
    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <UiFormField label="Email" for="login-email">
        <template #default="{ id }">
          <UiInput :id="id" v-model="email" type="email" autocomplete="email" required />
        </template>
      </UiFormField>

      <UiFormField label="Password" for="login-password">
        <template #default="{ id }">
          <UiInput
            :id="id"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </template>
      </UiFormField>

      <UiButton type="submit" block :disabled="loading">
        {{ loading ? "Signing in..." : "Log in" }}
      </UiButton>
    </form>

    <div class="my-4 flex items-center gap-3 text-sm text-muted">
      <span class="h-px flex-1 bg-border" />or<span class="h-px flex-1 bg-border" />
    </div>

    <div class="flex flex-col gap-2">
      <UiButton variant="surface" block @click="withGithub">Continue with GitHub</UiButton>
      <UiButton variant="surface" block @click="withPasskey">Sign in with a passkey</UiButton>
    </div>

    <template #footer>
      <div class="flex justify-between text-sm">
        <NuxtLink to="/forgot-password" class="text-accent underline">Forgot password?</NuxtLink>
        <NuxtLink to="/signup" class="text-accent underline">Create account</NuxtLink>
      </div>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
definePageMeta({ layout: "auth" })
useHead({ title: "Log in" })

const email = ref("")
const password = ref("")
const loading = ref(false)
const { push } = useToast()

async function onSubmit(): Promise<void> {
  loading.value = true
  const { error } = await authClient.signIn.email({ email: email.value, password: password.value })
  loading.value = false
  if (error) {
    // 403 here means the email is not verified. Send them to confirm it
    // instead of a dead-end error, where they can resend the link.
    if (error.status === 403) {
      await navigateTo(`/verify-email?email=${encodeURIComponent(email.value)}`)
      return
    }
    push({
      title: "Could not sign in",
      description: error.message ?? "Check your details.",
      variant: "danger",
    })
    return
  }
  await refreshNuxtData("current-session")
  await navigateTo("/dashboard")
}

async function withGithub(): Promise<void> {
  await authClient.signIn.social({ provider: "github", callbackURL: "/dashboard" })
}

async function withPasskey(): Promise<void> {
  try {
    const res = await authClient.signIn.passkey()
    if (res?.error) {
      push({
        title: "Passkey sign-in failed",
        description: res.error.message ?? "Try again.",
        variant: "danger",
      })
      return
    }
    await refreshNuxtData("current-session")
    await navigateTo("/dashboard")
  } catch {
    push({ title: "Passkey sign-in cancelled", variant: "danger" })
  }
}
</script>
