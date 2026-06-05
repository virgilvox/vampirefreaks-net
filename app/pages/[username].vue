<template>
  <section v-if="profile" class="flex flex-col gap-6">
    <VfProfileHeader
      :profile="profile"
      :can-rate="canRate"
      @rate="rate"
      @friend="friend"
      @unfriend="unfriend"
      @accept="accept"
      @message="messageOpen = true"
    />

    <div class="vf-profile-grid">
      <div class="vf-profile-col-main">
        <VfProfileBody
          :username="profile.username"
          :bio="profile.bio"
          :bg-color="profile.bgColor"
          :text-color="profile.textColor"
          :link-color="profile.linkColor"
          :accent-color="profile.accentColor"
          :bg-image-url="profile.bgImageUrl"
          :font-choice="profile.fontChoice"
          :custom-css="profile.customCss"
        />
      </div>
      <aside class="vf-profile-col-side">
        <UiCard title="Stats">
          <ul class="vf-stat-list">
            <li>
              <span>Member since</span><span>{{ memberSince }}</span>
            </li>
            <li v-if="profile.leaderboardBucket !== 'none' && profile.average != null">
              <span>Rating</span><span class="text-accent">{{ profile.average.toFixed(1) }}</span>
            </li>
          </ul>
          <NuxtLink :to="`/${profile.username}/friends`" class="vf-side-link">Friends</NuxtLink>
          <NuxtLink v-if="isOwner" to="/account" class="vf-side-link">Edit profile</NuxtLink>
        </UiCard>
      </aside>
    </div>

    <UiDialog
      v-model:open="messageOpen"
      :title="`Message ${profile.username}`"
      description="Sends to their private inbox."
    >
      <form class="flex flex-col gap-4" @submit.prevent="send">
        <UiFormField label="Subject" for="msg-subject">
          <template #default="{ id }"
            ><UiInput :id="id" v-model="msg.subject" placeholder="Optional"
          /></template>
        </UiFormField>
        <UiFormField label="Message" for="msg-body">
          <template #default="{ id }"><UiInput :id="id" v-model="msg.body" required /></template>
        </UiFormField>
      </form>
      <template #footer>
        <UiButton variant="ghost" @click="messageOpen = false">Cancel</UiButton>
        <UiButton :disabled="sending" @click="send">{{ sending ? "Sending..." : "Send" }}</UiButton>
      </template>
    </UiDialog>
  </section>

  <section v-else class="py-16 text-center text-muted">
    <h1 class="font-display text-3xl text-text">Not found</h1>
    <p>No member goes by that name.</p>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
const username = computed(() => String(route.params.username))
const { push } = useToast()

const { user } = await useCurrentUser()
const canRate = computed(() => Boolean(user.value))

type PublicProfile = {
  userId: string
  username: string
  displayName?: string | null
  tagline?: string | null
  bio?: string | null
  location?: string | null
  leaderboardBucket: string
  bgColor?: string | null
  textColor?: string | null
  linkColor?: string | null
  accentColor?: string | null
  bgImageUrl?: string | null
  fontChoice?: string | null
  customCss?: string | null
  indexable: boolean
  average?: number | null
  ratingCount?: number | null
  viewerRating?: number | null
  friendStatus: "none" | "pending_out" | "pending_in" | "friends" | "self"
  createdAt: string
}

const { data: profile, refresh } = await useFetch<PublicProfile | null>(
  () => `/api/profiles/${username.value}`,
  { default: () => null },
)

const isOwner = computed(() => profile.value?.friendStatus === "self")
const memberSince = computed(() =>
  profile.value ? new Date(profile.value.createdAt).toLocaleDateString() : "",
)

useHead(() => ({
  title: profile.value ? `${profile.value.displayName || profile.value.username}` : "Not found",
  meta: [
    { name: "description", content: profile.value?.tagline ?? "A vampirefreaks profile." },
    ...(profile.value && !profile.value.indexable ? [{ name: "robots", content: "noindex" }] : []),
  ],
}))

const messageOpen = ref(false)
const sending = ref(false)
const msg = reactive({ subject: "", body: "" })

async function rate(score: number): Promise<void> {
  if (!canRate.value) {
    await navigateTo("/login")
    return
  }
  try {
    await $fetch(`/api/profiles/${username.value}/rating`, { method: "PUT", body: { score } })
    await refresh()
  } catch {
    push({ title: "Could not save rating", variant: "danger" })
  }
}

async function friend(): Promise<void> {
  if (!canRate.value) {
    await navigateTo("/login")
    return
  }
  await $fetch(`/api/friends/${username.value}`, { method: "POST" }).catch(() => null)
  await refresh()
}
async function accept(): Promise<void> {
  await $fetch(`/api/friends/${username.value}/respond`, {
    method: "POST",
    body: { action: "accept" },
  }).catch(() => null)
  await refresh()
}
async function unfriend(): Promise<void> {
  await $fetch(`/api/friends/${username.value}`, { method: "DELETE" }).catch(() => null)
  await refresh()
}

async function send(): Promise<void> {
  if (!msg.body.trim()) return
  sending.value = true
  try {
    await $fetch("/api/messages", {
      method: "POST",
      body: { to: username.value, subject: msg.subject, body: msg.body },
    })
    messageOpen.value = false
    msg.subject = ""
    msg.body = ""
    push({ title: "Message sent" })
  } catch {
    push({ title: "Could not send message", variant: "danger" })
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.vf-profile-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 768px) {
  .vf-profile-grid {
    grid-template-columns: 2fr 1fr;
  }
}
.vf-stat-list {
  list-style: none;
  margin: 0 0 0.75rem;
  padding: 0;
  font-size: 0.9rem;
}
.vf-stat-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.2rem 0;
  border-bottom: 1px solid var(--color-border);
}
.vf-side-link {
  display: block;
  color: var(--color-muted);
  text-decoration: none;
  padding: 0.15rem 0;
}
.vf-side-link:hover {
  color: var(--color-accent);
}
</style>
