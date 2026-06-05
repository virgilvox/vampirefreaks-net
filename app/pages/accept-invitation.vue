<template>
  <UiCard title="Accept invitation">
    <div class="flex flex-col gap-4">
      <p v-if="!invitationId" class="text-danger">This link is missing its invitation id.</p>

      <template v-else-if="!user">
        <p class="text-muted">Log in or create an account to accept this invitation.</p>
        <NuxtLink :to="`/login`"><UiButton block>Log in</UiButton></NuxtLink>
        <NuxtLink :to="`/signup`"
          ><UiButton variant="surface" block>Create account</UiButton></NuxtLink
        >
      </template>

      <template v-else>
        <p class="text-muted">You have been invited to join an organization.</p>
        <UiButton :disabled="accepting" block @click="accept">
          {{ accepting ? "Joining..." : "Accept invitation" }}
        </UiButton>
      </template>
    </div>

    <template #footer>
      <NuxtLink to="/organizations" class="text-sm text-accent underline">
        Go to organizations
      </NuxtLink>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
// Where the invitation email link lands. Acceptance needs a session, so an
// unauthenticated visitor is asked to sign in first; their email must match the
// invitation for the accept to succeed.
definePageMeta({ layout: "auth" })
useHead({ title: "Accept invitation" })

const route = useRoute()
const { user } = await useCurrentUser()
const { push } = useToast()

const invitationId = computed<string>(() => String(route.query.id ?? ""))
const accepting = ref(false)

async function accept(): Promise<void> {
  if (!invitationId.value) return
  accepting.value = true
  const { error } = await authClient.organization.acceptInvitation({
    invitationId: invitationId.value,
  })
  accepting.value = false
  if (error) {
    push({
      title: "Could not accept",
      description: error.message ?? "The invitation may be invalid or for a different email.",
      variant: "danger",
    })
    return
  }
  push({ title: "Invitation accepted" })
  await navigateTo("/organizations")
}
</script>
