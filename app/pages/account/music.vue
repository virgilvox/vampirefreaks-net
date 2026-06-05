<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-3">
      <h1 class="vf-page-title">Your music</h1>
      <NuxtLink to="/account"><UiButton variant="surface">Account</UiButton></NuxtLink>
    </div>

    <VfPanel title="Upload a track">
      <form class="vf-upload" @submit.prevent="upload">
        <input
          ref="fileInput"
          type="file"
          accept="audio/mpeg,audio/ogg,audio/wav,audio/mp4,.mp3,.ogg,.wav,.m4a"
          aria-label="Choose an audio file"
          @change="onPick"
        />
        <UiInput v-model="title" placeholder="Track title" />
        <UiButton type="submit" :disabled="uploading || !file || !title.trim()">
          {{ uploading ? "Uploading..." : "Upload" }}
        </UiButton>
      </form>
      <p class="vf-hint">MP3, OGG, WAV, or M4A, up to 15 MB.</p>
    </VfPanel>

    <VfPanel title="Your tracks" flush>
      <ul v-if="songs.length" class="vf-tracks">
        <li v-for="s in songs" :key="s.id" class="vf-track">
          <div class="vf-track-main">
            <span class="vf-track-title">{{ s.title }}</span>
            <span v-if="profileSongId === s.id" class="vf-track-badge">profile song</span>
            <audio :src="s.url" controls preload="none" class="vf-track-audio" />
          </div>
          <div class="vf-track-actions">
            <UiButton v-if="profileSongId !== s.id" variant="surface" @click="setProfileSong(s.id)">
              Set as profile song
            </UiButton>
            <UiButton v-else variant="ghost" @click="setProfileSong(null)">Unset</UiButton>
            <UiButton variant="ghost" @click="remove(s.id)">Delete</UiButton>
          </div>
        </li>
      </ul>
      <p v-else class="vf-empty">No tracks yet.</p>
    </VfPanel>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "onboarded" })
useHead({ title: "Your music" })
const { push } = useToast()
const { profile, refresh: refreshProfile } = await useProfile()
const profileSongId = computed(() => profile.value?.profileSongId ?? null)

type Song = {
  id: string
  title: string
  url: string
  bandId: string | null
  bandName: string | null
}
const cookieHeaders = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
const { data: songs, refresh } = await useFetch<Song[]>("/api/songs", {
  default: () => [],
  headers: cookieHeaders,
})

const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const title = ref("")
const uploading = ref(false)

function onPick(e: Event): void {
  file.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function upload(): Promise<void> {
  if (!file.value || !title.value.trim()) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append("file", file.value)
    fd.append("title", title.value.trim())
    await $fetch("/api/songs", { method: "POST", body: fd })
    file.value = null
    title.value = ""
    if (fileInput.value) fileInput.value.value = ""
    await refresh()
    push({ title: "Track uploaded" })
  } catch {
    push({ title: "Could not upload that", variant: "danger" })
  } finally {
    uploading.value = false
  }
}

async function setProfileSong(id: string | null): Promise<void> {
  await $fetch("/api/profile", { method: "PATCH", body: { profileSongId: id } }).catch(() => null)
  await refreshProfile()
  push({ title: id ? "Profile song set" : "Profile song cleared" })
}

async function remove(id: string): Promise<void> {
  await $fetch(`/api/songs/${id}`, { method: "DELETE" }).catch(() => null)
  await Promise.all([refresh(), refreshProfile()])
}
</script>

<style scoped>
.vf-page-title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  color: var(--color-text);
}
.vf-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.vf-hint {
  margin-top: 0.4rem;
  font-size: 0.74rem;
  color: var(--color-muted);
}
.vf-tracks {
  list-style: none;
  margin: 0;
  padding: 0;
}
.vf-track {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 0.7rem;
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.vf-tracks li:last-child {
  border-bottom: none;
}
.vf-track-main {
  flex: 1;
  min-width: 12rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.vf-track-title {
  font-weight: 700;
  font-size: 0.88rem;
}
.vf-track-badge {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-accent);
}
.vf-track-audio {
  width: 100%;
  max-width: 22rem;
  height: 2rem;
}
.vf-track-actions {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  flex-wrap: wrap;
}
.vf-empty {
  padding: 0.6rem;
  color: var(--color-muted);
  font-style: italic;
}
</style>
