<template>
  <section class="mx-auto flex max-w-lg flex-col gap-6">
    <div>
      <h1 class="font-display text-3xl font-bold">Claim your name</h1>
      <p class="text-muted">
        Pick a handle and set up the basics. You can change everything but the handle later.
      </p>
    </div>

    <UiCard>
      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <UiFormField
          label="Username"
          for="ob-username"
          :error="errors.username"
          hint="3 to 20 characters: lowercase letters, numbers, underscore. This is your profile URL."
        >
          <template #default="{ id, invalid }">
            <UiInput
              :id="id"
              v-model="form.username"
              :invalid="invalid"
              required
              autocomplete="username"
            />
          </template>
        </UiFormField>

        <UiFormField
          label="Display name"
          for="ob-display"
          hint="Optional. Shown above your handle."
        >
          <template #default="{ id }">
            <UiInput :id="id" v-model="form.displayName" />
          </template>
        </UiFormField>

        <UiFormField label="Tagline" for="ob-tagline" hint="Optional. One line under your name.">
          <template #default="{ id }">
            <UiInput :id="id" v-model="form.tagline" />
          </template>
        </UiFormField>

        <UiFormField label="Leaderboard">
          <UiSelect v-model="form.leaderboardBucket" :options="bucketOptions" />
        </UiFormField>

        <UiFormField
          label="Birthdate"
          for="ob-birth"
          :error="errors.birthdate"
          hint="Used once for an age check. Not shown publicly."
        >
          <template #default="{ id, invalid }">
            <UiInput :id="id" v-model="form.birthdate" type="date" :invalid="invalid" />
          </template>
        </UiFormField>

        <div class="flex justify-end">
          <UiButton type="submit" :disabled="saving">{{
            saving ? "Claiming..." : "Enter"
          }}</UiButton>
        </div>
      </form>
    </UiCard>
  </section>
</template>

<script setup lang="ts">
import type { Profile } from "../../server/db/schema"

definePageMeta({ middleware: "auth" })
useHead({ title: "Welcome" })

const { push } = useToast()

// Already onboarded? Go straight to the profile.
const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
const existing = await $fetch<Profile | null>("/api/profile/me", { headers }).catch(() => null)
if (existing) await navigateTo(`/${existing.username}`)

const bucketOptions = [
  { label: "Not listed", value: "none" },
  { label: "Top boys", value: "boys" },
  { label: "Top girls", value: "girls" },
  { label: "Everyone", value: "everyone" },
]

const form = reactive({
  username: "",
  displayName: "",
  tagline: "",
  leaderboardBucket: "none",
  birthdate: "",
})
const errors = reactive<{ username?: string; birthdate?: string }>({})
const saving = ref(false)

async function submit(): Promise<void> {
  errors.username = undefined
  errors.birthdate = undefined
  if (!form.username.trim()) {
    errors.username = "Pick a username"
    return
  }
  saving.value = true
  try {
    const profile = await $fetch<Profile>("/api/profile", { method: "POST", body: { ...form } })
    await navigateTo(`/${profile.username}`)
  } catch (e) {
    const msg =
      (e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Could not finish setup"
    if (/username|taken|reserved/i.test(msg)) errors.username = msg
    else push({ title: msg, variant: "danger" })
  } finally {
    saving.value = false
  }
}
</script>
