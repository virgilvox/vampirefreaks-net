<template>
  <div class="vf-ph">
    <img
      v-if="profile.avatarUrl"
      :src="profile.avatarUrl"
      :alt="`${profile.username} avatar`"
      class="vf-ph-avatar vf-ph-avatar-img"
    />
    <div v-else class="vf-ph-avatar" aria-hidden="true">{{ initial }}</div>
    <div class="vf-ph-main">
      <h1 class="vf-ph-name">{{ profile.displayName || profile.username }}</h1>
      <p class="vf-ph-handle">@{{ profile.username }}</p>
      <p v-if="profile.tagline" class="vf-ph-tagline">{{ profile.tagline }}</p>
      <p v-if="profile.location" class="vf-ph-meta">{{ profile.location }}</p>
    </div>

    <div class="vf-ph-side">
      <VfRatingWidget
        v-if="profile.leaderboardBucket !== 'none'"
        :average="profile.average"
        :rating-count="profile.ratingCount"
        :your-score="profile.viewerRating"
        :disabled="profile.friendStatus === 'self' || !canRate"
        @rate="(s) => emit('rate', s)"
      />

      <div v-if="profile.friendStatus !== 'self'" class="vf-ph-actions">
        <template v-if="canRate">
          <UiButton v-if="profile.friendStatus === 'none'" variant="surface" @click="emit('friend')"
            >Add friend</UiButton
          >
          <UiButton
            v-else-if="profile.friendStatus === 'pending_out'"
            variant="ghost"
            @click="emit('unfriend')"
            >Request sent</UiButton
          >
          <UiButton v-else-if="profile.friendStatus === 'pending_in'" @click="emit('accept')"
            >Accept request</UiButton
          >
          <UiButton
            v-else-if="profile.friendStatus === 'friends'"
            variant="ghost"
            @click="emit('unfriend')"
            >Friends</UiButton
          >
          <UiButton variant="surface" @click="emit('message')">Message</UiButton>
        </template>
        <NuxtLink v-else to="/login"
          ><UiButton variant="surface">Log in to connect</UiButton></NuxtLink
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

type PublicProfile = {
  username: string
  displayName?: string | null
  tagline?: string | null
  location?: string | null
  avatarUrl?: string | null
  leaderboardBucket: string
  average?: number | null
  ratingCount?: number | null
  viewerRating?: number | null
  friendStatus: "none" | "pending_out" | "pending_in" | "friends" | "self"
}

const props = defineProps<{ profile: PublicProfile; canRate: boolean }>()
const emit = defineEmits<{
  rate: [score: number]
  friend: []
  unfriend: []
  accept: []
  message: []
}>()

const initial = computed(() =>
  (props.profile.displayName || props.profile.username).charAt(0).toUpperCase(),
)
</script>

<style scoped>
.vf-ph {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-block);
  background: var(--color-surface);
  padding: 1.25rem;
  box-shadow: var(--shadow-block);
}
.vf-ph-avatar {
  width: 4.5rem;
  height: 4.5rem;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--color-accent-text);
  background: var(--color-accent);
  border-radius: var(--radius-block);
}
.vf-ph-avatar-img {
  object-fit: cover;
}
.vf-ph-main {
  flex: 1;
  min-width: 12rem;
}
.vf-ph-name {
  font-family: var(--font-display);
  font-size: 2rem;
  line-height: 1.1;
}
.vf-ph-handle {
  color: var(--color-muted);
  font-family: var(--font-mono);
  font-size: 0.85rem;
}
.vf-ph-tagline {
  margin-top: 0.5rem;
  font-style: italic;
}
.vf-ph-meta {
  color: var(--color-muted);
  font-size: 0.85rem;
}
.vf-ph-side {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
}
.vf-ph-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}
</style>
