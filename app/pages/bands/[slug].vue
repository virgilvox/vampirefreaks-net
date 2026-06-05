<template>
  <section v-if="band" class="flex flex-col gap-3">
    <p class="vf-crumb"><NuxtLink to="/bands">Music</NuxtLink> /</p>

    <div class="vf-band-head">
      <div>
        <h1 class="vf-band-title">
          {{ band.name }}
          <span v-if="!band.approved" class="vf-pending">pending review</span>
        </h1>
        <p class="vf-band-meta">{{ [band.genre, band.location].filter(Boolean).join(" · ") }}</p>
        <p v-if="band.ownerUsername" class="vf-band-meta">
          run by
          <NuxtLink :to="`/${band.ownerUsername}`" class="vf-link">{{
            band.ownerUsername
          }}</NuxtLink>
        </p>
      </div>
      <UiButton v-if="band.canApprove && !band.approved" @click="approve">Approve</UiButton>
    </div>

    <VfPanel v-if="band.bio" title="About">
      <p class="vf-band-bio">{{ band.bio }}</p>
    </VfPanel>

    <VfPanel title="Tracks" flush>
      <ul v-if="band.tracks.length" class="vf-band-tracks">
        <li v-for="t in band.tracks" :key="t.id">
          <VfMusicPlayer :src="t.url" :title="t.title" />
        </li>
      </ul>
      <p v-else class="vf-empty">No tracks yet.</p>
    </VfPanel>

    <VfPanel v-if="band.isOwner && mySongs.length" title="Attach one of your tracks">
      <div class="vf-attach">
        <UiSelect v-model="attachId" :options="attachOptions" placeholder="Pick a track" />
        <UiButton :disabled="!attachId" @click="attach">Attach</UiButton>
      </div>
      <p class="vf-hint">
        Upload tracks on <NuxtLink to="/account/music" class="vf-link">your music</NuxtLink> page.
      </p>
    </VfPanel>
  </section>

  <section v-else class="py-16 text-center text-muted">No such band.</section>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug))
const { push } = useToast()
const { profile } = await useProfile()

type Track = { id: string; title: string; url: string }
type Band = {
  id: string
  slug: string
  name: string
  genre: string | null
  location: string | null
  bio: string
  approved: boolean
  ownerUsername: string | null
  tracks: Track[]
  isOwner: boolean
  canApprove: boolean
}

const cookieHeaders = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
const { data: band, refresh } = await useFetch<Band | null>(() => `/api/bands/${slug.value}`, {
  default: () => null,
  headers: cookieHeaders,
})
useHead(() => ({ title: band.value?.name || "Band" }))

type MySong = { id: string; title: string; bandId: string | null }
const { data: mySongsData } = await useFetch<MySong[]>("/api/songs", {
  default: () => [],
  headers: cookieHeaders,
  immediate: Boolean(profile.value),
})
const mySongs = computed(() => mySongsData.value ?? [])
const attachOptions = computed(() =>
  mySongs.value.filter((s) => !s.bandId).map((s) => ({ label: s.title, value: s.id })),
)
const attachId = ref("")

async function attach(): Promise<void> {
  if (!attachId.value || !band.value) return
  await $fetch(`/api/songs/${attachId.value}`, {
    method: "PATCH",
    body: { bandId: band.value.id },
  }).catch(() => null)
  attachId.value = ""
  await refresh()
  push({ title: "Track attached" })
}

async function approve(): Promise<void> {
  await $fetch(`/api/bands/${slug.value}`, { method: "PATCH", body: { approved: true } }).catch(
    () => null,
  )
  await refresh()
  push({ title: "Band approved" })
}
</script>

<style scoped>
.vf-crumb {
  font-size: 0.75rem;
  color: var(--color-muted);
}
.vf-crumb a {
  color: var(--color-muted);
  text-decoration: none;
}
.vf-crumb a:hover {
  color: var(--color-accent);
}
.vf-band-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.vf-band-title {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--color-accent);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.vf-pending {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-block);
  padding: 0 0.3rem;
}
.vf-band-meta {
  font-size: 0.82rem;
  color: var(--color-muted);
}
.vf-link {
  color: var(--color-accent);
  text-decoration: none;
}
.vf-link:hover {
  text-decoration: underline;
}
.vf-band-bio {
  white-space: pre-wrap;
  font-size: 0.9rem;
  line-height: 1.55;
}
.vf-band-tracks {
  list-style: none;
  margin: 0;
  padding: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.vf-attach {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.vf-hint {
  margin-top: 0.4rem;
  font-size: 0.74rem;
  color: var(--color-muted);
}
.vf-empty {
  padding: 0.6rem;
  color: var(--color-muted);
  font-style: italic;
}
</style>
