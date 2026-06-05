<template>
  <section class="flex flex-col gap-6">
    <div>
      <h1 class="font-display text-3xl font-bold">Account</h1>
      <p class="text-muted">Signed in as {{ user?.email }}.</p>
    </div>

    <UiCard v-if="!profile" title="Finish setting up">
      <p class="text-muted">You have not claimed a username yet.</p>
      <template #footer>
        <NuxtLink to="/onboarding"><UiButton>Claim your name</UiButton></NuxtLink>
      </template>
    </UiCard>

    <UiCard v-else title="Profile" :subtitle="`vampirefreaks.net/${profile.username}`">
      <form class="flex flex-col gap-4" @submit.prevent="saveProfile">
        <UiFormField label="Display name" for="p-display">
          <template #default="{ id }"><UiInput :id="id" v-model="form.displayName" /></template>
        </UiFormField>
        <UiFormField label="Tagline" for="p-tagline">
          <template #default="{ id }"><UiInput :id="id" v-model="form.tagline" /></template>
        </UiFormField>
        <UiFormField label="Location" for="p-location">
          <template #default="{ id }"><UiInput :id="id" v-model="form.location" /></template>
        </UiFormField>
        <UiFormField label="Bio" for="p-bio" hint="Plain text. Shows in the body of your profile.">
          <template #default="{ id }">
            <textarea
              :id="id"
              v-model="form.bio"
              rows="5"
              class="jig-input w-full rounded-block border-2 border-border bg-surface px-3 py-2 text-text"
            />
          </template>
        </UiFormField>
        <UiFormField label="Leaderboard">
          <UiSelect v-model="form.leaderboardBucket" :options="bucketOptions" />
        </UiFormField>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.indexable" type="checkbox" />
          Let search engines index my profile
        </label>

        <details class="vf-custom">
          <summary class="font-display">Customize the look</summary>
          <div class="flex flex-col gap-4 pt-4">
            <div class="vf-color-row">
              <label>Background<input v-model="form.bgColor" type="color" /></label>
              <label>Text<input v-model="form.textColor" type="color" /></label>
              <label>Links<input v-model="form.linkColor" type="color" /></label>
              <label>Accent<input v-model="form.accentColor" type="color" /></label>
            </div>
            <UiFormField label="Font">
              <UiSelect v-model="form.fontChoice" :options="fontOptions" />
            </UiFormField>
            <UiFormField
              label="Background image URL"
              for="p-bgimg"
              hint="Must be hosted on the site media CDN."
            >
              <template #default="{ id }"><UiInput :id="id" v-model="form.bgImageUrl" /></template>
            </UiFormField>
            <UiFormField
              label="Custom CSS"
              for="p-css"
              hint="Scoped to your profile body. Sanitized on save."
            >
              <template #default="{ id }">
                <textarea
                  :id="id"
                  v-model="form.customCss"
                  rows="6"
                  class="jig-input w-full rounded-block border-2 border-border bg-surface px-3 py-2 font-mono text-sm text-text"
                />
              </template>
            </UiFormField>
          </div>
        </details>

        <div class="flex justify-end">
          <UiButton type="submit" :disabled="savingProfile">{{
            savingProfile ? "Saving..." : "Save profile"
          }}</UiButton>
        </div>
      </form>
    </UiCard>

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
          <UiButton :disabled="adding" @click="addPasskey">{{
            adding ? "Waiting..." : "Add passkey"
          }}</UiButton>
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
const { profile, refresh: refreshProfile } = await useProfile()
const { push } = useToast()

const bucketOptions = [
  { label: "Not listed", value: "none" },
  { label: "Top boys", value: "boys" },
  { label: "Top girls", value: "girls" },
  { label: "Everyone", value: "everyone" },
]
const fontOptions = [
  { label: "Gothic display", value: "display" },
  { label: "Serif body", value: "body" },
  { label: "Monospace", value: "mono" },
  { label: "Georgia", value: "serif" },
  { label: "System", value: "system" },
]

const form = reactive({
  displayName: "",
  tagline: "",
  location: "",
  bio: "",
  leaderboardBucket: "none",
  indexable: true,
  bgColor: "#0a0a0c",
  textColor: "#d9d3dc",
  linkColor: "#b3122a",
  accentColor: "#b3122a",
  fontChoice: "body",
  bgImageUrl: "",
  customCss: "",
})

watchEffect(() => {
  const p = profile.value
  if (!p) return
  form.displayName = p.displayName ?? ""
  form.tagline = p.tagline ?? ""
  form.location = p.location ?? ""
  form.bio = p.bio ?? ""
  form.leaderboardBucket = p.leaderboardBucket
  form.indexable = p.indexable
  form.bgColor = p.bgColor ?? "#0a0a0c"
  form.textColor = p.textColor ?? "#d9d3dc"
  form.linkColor = p.linkColor ?? "#b3122a"
  form.accentColor = p.accentColor ?? "#b3122a"
  form.fontChoice = p.fontChoice ?? "body"
  form.bgImageUrl = p.bgImageUrl ?? ""
  form.customCss = p.customCss ?? ""
})

const savingProfile = ref(false)
async function saveProfile(): Promise<void> {
  savingProfile.value = true
  try {
    await $fetch("/api/profile", { method: "PATCH", body: { ...form } })
    await refreshProfile()
    push({ title: "Profile saved" })
  } catch {
    push({ title: "Could not save profile", variant: "danger" })
  } finally {
    savingProfile.value = false
  }
}

const passkeys = ref<Passkey[]>([])
const newName = ref("")
const adding = ref(false)

async function loadPasskeys(): Promise<void> {
  const { data } = await authClient.passkey.listUserPasskeys()
  passkeys.value = data ?? []
}
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
  if (!value) return "-"
  return new Date(value).toLocaleDateString()
}
</script>

<style scoped>
.vf-custom summary {
  cursor: pointer;
  color: var(--color-accent);
}
.vf-color-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.vf-color-row label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--color-muted);
}
</style>
