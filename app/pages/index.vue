<template>
  <section class="flex flex-col gap-8">
    <div v-if="!user" class="vf-hero">
      <h1 class="vf-hero-title">vampirefreaks</h1>
      <p class="vf-hero-sub">
        The goth and industrial network, rebuilt. Make a profile, get rated, join a cult, talk in
        the forums, find the music. A homage to the era of 2003 to 2008.
      </p>
      <div class="flex flex-wrap gap-3">
        <NuxtLink to="/signup"><UiButton>Join the night</UiButton></NuxtLink>
        <NuxtLink to="/login"><UiButton variant="surface">Log in</UiButton></NuxtLink>
      </div>
    </div>

    <div v-else class="flex items-center justify-between gap-4">
      <h1 class="font-display text-3xl font-bold">The crypt</h1>
      <NuxtLink v-if="profile" :to="`/${profile.username}`">
        <UiButton variant="surface">My profile</UiButton>
      </NuxtLink>
      <NuxtLink v-else to="/onboarding"><UiButton>Finish setup</UiButton></NuxtLink>
    </div>

    <div class="vf-panels">
      <UiCard title="Most popular">
        <VfLeaderboardPanel :rows="home?.popular ?? []" />
      </UiCard>
      <UiCard title="Top boys">
        <VfLeaderboardPanel :rows="home?.boys ?? []" />
      </UiCard>
      <UiCard title="Top girls">
        <VfLeaderboardPanel :rows="home?.girls ?? []" />
      </UiCard>
      <UiCard title="Newest members">
        <VfLeaderboardPanel :rows="home?.newest ?? []" :show-average="false" />
      </UiCard>
    </div>
  </section>
</template>

<script setup lang="ts">
useHead({
  title: "vampirefreaks — goth and industrial network",
  meta: [
    {
      name: "description",
      content:
        "A revival of the VampireFreaks social network era. Profiles, ratings, cults, forums, and music for the goth and industrial scene.",
    },
  ],
})

const { user } = await useCurrentUser()
const { profile } = await useProfile()

type Row = { username: string; displayName: string | null; average?: number; ratingCount?: number }
const { data: home } = await useFetch<{ popular: Row[]; boys: Row[]; girls: Row[]; newest: Row[] }>(
  "/api/home",
  { default: () => ({ popular: [], boys: [], girls: [], newest: [] }) },
)
</script>

<style scoped>
.vf-hero {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-block);
  background: var(--color-surface);
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-block);
}
.vf-hero-title {
  font-family: var(--font-display);
  font-size: 3.5rem;
  line-height: 1;
  color: var(--color-accent);
}
.vf-hero-sub {
  max-width: 42rem;
  font-size: 1.15rem;
  color: var(--color-muted);
}
.vf-panels {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 640px) {
  .vf-panels {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
