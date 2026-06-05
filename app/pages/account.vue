<template>
  <section class="flex flex-col gap-6">
    <div>
      <h1 class="font-display text-3xl font-bold">Account</h1>
      <p class="text-muted">Signed in as {{ user?.email }}.</p>
    </div>

    <UiCard title="Email">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p>{{ user?.email }}</p>
          <p class="text-sm" :class="user?.emailVerified ? 'text-success' : 'text-muted'">
            {{ user?.emailVerified ? "Verified" : "Not verified" }}
          </p>
        </div>
        <NuxtLink v-if="!user?.emailVerified" to="/verify-email">
          <UiButton variant="surface">Verify email</UiButton>
        </NuxtLink>
      </div>
    </UiCard>

    <UiCard title="Passkeys" subtitle="Sign in without a password.">
      <div class="flex flex-col gap-5">
        <div class="flex items-end gap-2">
          <div class="flex-1">
            <UiFormField
              label="Name a new passkey"
              for="pk-name"
              hint="For example, MacBook Touch ID."
            >
              <template #default="{ id }">
                <UiInput :id="id" v-model="newName" placeholder="My device" />
              </template>
            </UiFormField>
          </div>
          <UiButton :disabled="adding" @click="addPasskey">
            {{ adding ? "Waiting..." : "Add passkey" }}
          </UiButton>
        </div>

        <UiTable v-if="passkeys.length" :columns="['Name', 'Added', '']">
          <tr v-for="pk in passkeys" :key="pk.id">
            <td>{{ pk.name || "Unnamed passkey" }}</td>
            <td class="text-muted">{{ formatDate(pk.createdAt) }}</td>
            <td class="text-right">
              <UiButton variant="ghost" @click="remove(pk.id)">Remove</UiButton>
            </td>
          </tr>
        </UiTable>
        <p v-else class="text-muted">No passkeys yet. Add one to sign in with your device.</p>
      </div>
    </UiCard>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" })
useHead({ title: "Account" })

type Passkey = typeof authClient.$Infer.Passkey

const { user } = await useCurrentUser()
const { push } = useToast()

const passkeys = ref<Passkey[]>([])
const newName = ref("")
const adding = ref(false)

async function loadPasskeys(): Promise<void> {
  const { data } = await authClient.passkey.listUserPasskeys()
  passkeys.value = data ?? []
}

// WebAuthn runs in the browser only, so the list loads after mount.
onMounted(loadPasskeys)

async function addPasskey(): Promise<void> {
  adding.value = true
  const res = await authClient.passkey.addPasskey({ name: newName.value || undefined })
  adding.value = false
  if (res?.error) {
    push({
      title: "Could not add passkey",
      description: res.error.message ?? "Try again.",
      variant: "danger",
    })
    return
  }
  newName.value = ""
  await loadPasskeys()
  push({ title: "Passkey added" })
}

async function remove(id: string): Promise<void> {
  const { error } = await authClient.passkey.deletePasskey({ id })
  if (error) {
    push({ title: "Could not remove passkey", variant: "danger" })
    return
  }
  await loadPasskeys()
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—"
  return new Date(value).toLocaleDateString()
}
</script>
