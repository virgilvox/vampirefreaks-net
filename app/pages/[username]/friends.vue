<template>
  <section class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="font-display text-3xl font-bold">{{ username }}'s friends</h1>
      <NuxtLink :to="`/${username}`"
        ><UiButton variant="surface">Back to profile</UiButton></NuxtLink
      >
    </div>

    <p v-if="friends && friends.length === 0" class="text-muted">No friends yet.</p>

    <ul v-else class="vf-friend-grid">
      <li v-for="f in friends" :key="f.username">
        <NuxtLink :to="`/${f.username}`" class="vf-friend">
          <span class="vf-friend-avatar" aria-hidden="true">{{
            (f.displayName || f.username).charAt(0).toUpperCase()
          }}</span>
          <span class="vf-friend-name">{{ f.displayName || f.username }}</span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
const username = computed(() => String(route.params.username))
useHead(() => ({ title: `${username.value}'s friends` }))

type Friend = { username: string; displayName: string | null }
const { data: friends } = await useFetch<Friend[]>(
  () => `/api/profiles/${username.value}/friends`,
  {
    default: () => [],
  },
)
</script>

<style scoped>
.vf-friend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
  gap: 0.75rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.vf-friend {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem;
  text-decoration: none;
  color: var(--color-text);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-block);
  background: var(--color-surface);
}
.vf-friend:hover {
  border-color: var(--color-accent);
}
.vf-friend-avatar {
  width: 3rem;
  height: 3rem;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  background: var(--color-surface-2);
  border-radius: var(--radius-block);
}
.vf-friend-name {
  font-size: 0.85rem;
  text-align: center;
}
</style>
