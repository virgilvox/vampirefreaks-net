<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-3">
      <h1 class="vf-page-title">{{ username }}'s pics</h1>
      <NuxtLink :to="`/${username}`"><UiButton variant="surface">Profile</UiButton></NuxtLink>
    </div>

    <VfPanel v-if="isOwner" title="Add a photo">
      <form class="vf-upload" @submit.prevent="upload">
        <input
          ref="fileInput"
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          aria-label="Choose a photo"
          @change="onPick"
        />
        <UiInput v-model="caption" placeholder="Caption (optional)" />
        <UiButton type="submit" :disabled="uploading || !file">
          {{ uploading ? "Uploading..." : "Upload" }}
        </UiButton>
      </form>
      <p class="vf-hint">PNG, JPEG, GIF, or WebP, up to 6 MB.</p>
    </VfPanel>

    <VfPanel flush>
      <div v-if="photos.length" class="vf-grid">
        <figure v-for="p in photos" :key="p.id" class="vf-photo">
          <img
            :src="p.url"
            :alt="p.caption || 'gallery photo'"
            class="vf-photo-img"
            @click="lightbox = p.url"
          />
          <figcaption v-if="p.caption" class="vf-photo-cap">{{ p.caption }}</figcaption>
          <span v-if="p.isPrimary" class="vf-photo-badge">avatar</span>
          <div v-if="isOwner" class="vf-photo-actions">
            <button v-if="!p.isPrimary" type="button" @click="setPrimary(p.id)">
              Set as avatar
            </button>
            <button type="button" class="vf-danger" @click="remove(p.id)">Delete</button>
          </div>
        </figure>
      </div>
      <p v-else class="vf-empty">No photos yet.</p>
    </VfPanel>

    <div
      v-if="lightbox"
      ref="lightboxEl"
      class="vf-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Photo"
      tabindex="-1"
      @click="lightbox = null"
      @keydown.esc="lightbox = null"
    >
      <img :src="lightbox" alt="photo" />
    </div>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
const username = computed(() => String(route.params.username))
useHead(() => ({ title: `${username.value}'s pics` }))
const { push } = useToast()
const { profile } = await useProfile()
const isOwner = computed(() => profile.value?.username === username.value)

type Photo = {
  id: string
  url: string
  caption: string | null
  isPrimary: boolean
  createdAt: string
}
const cookieHeaders = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
const { data: photos, refresh } = await useFetch<Photo[]>(
  () => `/api/profiles/${username.value}/photos`,
  { default: () => [], headers: cookieHeaders },
)

const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const caption = ref("")
const uploading = ref(false)
const lightbox = ref<string | null>(null)
const lightboxEl = ref<HTMLElement | null>(null)

// Focus the lightbox when it opens so Escape and a click anywhere dismiss it.
watch(lightbox, async (url) => {
  if (!url) return
  await nextTick()
  lightboxEl.value?.focus()
})

function onPick(e: Event): void {
  file.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function upload(): Promise<void> {
  if (!file.value) return
  uploading.value = true
  try {
    const form = new FormData()
    form.append("file", file.value)
    if (caption.value.trim()) form.append("caption", caption.value.trim())
    await $fetch("/api/photos", { method: "POST", body: form })
    file.value = null
    caption.value = ""
    if (fileInput.value) fileInput.value.value = ""
    await refresh()
    push({ title: "Photo added" })
  } catch {
    push({ title: "Could not upload that", variant: "danger" })
  } finally {
    uploading.value = false
  }
}

async function setPrimary(id: string): Promise<void> {
  await $fetch(`/api/photos/${id}`, { method: "PATCH", body: { isPrimary: true } }).catch(
    () => null,
  )
  await refresh()
  push({ title: "Avatar updated" })
}

async function remove(id: string): Promise<void> {
  await $fetch(`/api/photos/${id}`, { method: "DELETE" }).catch(() => null)
  await refresh()
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
.vf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: 0.5rem;
  padding: 0.6rem;
}
.vf-photo {
  position: relative;
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-block);
  overflow: hidden;
  background: var(--color-surface-2);
}
.vf-photo-img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  cursor: zoom-in;
  display: block;
}
.vf-photo-cap {
  font-size: 0.74rem;
  padding: 0.25rem 0.4rem;
  color: var(--color-muted);
}
.vf-photo-badge {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--color-accent);
  color: var(--color-accent-text);
  border-radius: var(--radius-block);
  padding: 0 0.3rem;
}
.vf-photo-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.3rem;
  padding: 0.25rem 0.4rem;
}
.vf-photo-actions button {
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.72rem;
  color: var(--color-accent);
}
.vf-photo-actions .vf-danger {
  color: var(--color-danger);
}
.vf-empty {
  padding: 0.6rem;
  color: var(--color-muted);
  font-style: italic;
}
.vf-lightbox {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  background: var(--color-overlay);
  padding: 2rem;
  cursor: zoom-out;
}
.vf-lightbox:focus {
  outline: none;
}
.vf-lightbox img {
  max-width: 100%;
  max-height: 100%;
  border: 2px solid var(--color-border);
}
</style>
