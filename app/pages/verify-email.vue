<template>
  <UiCard title="Verify your email">
    <div class="flex flex-col gap-4">
      <p v-if="verified" class="text-muted">Your email is verified. You are all set.</p>
      <template v-else>
        <p class="text-muted">
          We sent a verification link to
          <span class="font-mono">{{ email || "your inbox" }}</span
          >. Click it to confirm your address.
        </p>
        <UiButton :disabled="sending || !email" block @click="resend">
          {{ sending ? "Sending..." : "Resend verification email" }}
        </UiButton>
      </template>
    </div>

    <template #footer>
      <div class="flex justify-between text-sm">
        <NuxtLink to="/dashboard" class="text-accent underline">Go to dashboard</NuxtLink>
        <NuxtLink to="/login" class="text-accent underline">Back to log in</NuxtLink>
      </div>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
// The verification hub. Lands here after signup when verification is required,
// and is linked from the account page. Reads the address from the session when
// signed in, or from the email query param passed by signup.
definePageMeta({ layout: "auth" })
useHead({ title: "Verify your email" })

const route = useRoute()
const { user } = await useCurrentUser()
const { push } = useToast()

const email = computed<string>(() => user.value?.email ?? String(route.query.email ?? ""))
const verified = computed<boolean>(() => user.value?.emailVerified ?? false)
const sending = ref(false)

async function resend(): Promise<void> {
  if (!email.value) return
  sending.value = true
  const { error } = await authClient.sendVerificationEmail({
    email: email.value,
    callbackURL: "/dashboard",
  })
  sending.value = false
  if (error) {
    push({
      title: "Could not send email",
      description: error.message ?? "Try again.",
      variant: "danger",
    })
    return
  }
  push({ title: "Verification email sent" })
}
</script>
