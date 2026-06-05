<template>
  <div class="flex flex-col gap-3">
    <div class="vf-featured">
      <VfPanel title="Featured Member">
        <div v-if="featuredMember" class="vf-feat">
          <NuxtLink :to="`/${featuredMember.username}`" class="vf-feat-img" aria-hidden="true">
            {{ (featuredMember.displayName || featuredMember.username).charAt(0).toUpperCase() }}
          </NuxtLink>
          <NuxtLink :to="`/${featuredMember.username}`" class="vf-feat-name">
            {{ featuredMember.displayName || featuredMember.username }}
          </NuxtLink>
        </div>
        <p v-else class="vf-feat-empty">No members yet.</p>
      </VfPanel>

      <VfPanel title="Featured Band">
        <div class="vf-feat">
          <span class="vf-feat-img vf-feat-soon" aria-hidden="true">&#9834;</span>
          <span class="vf-feat-name vf-muted">Band pages land soon</span>
        </div>
      </VfPanel>

      <VfPanel title="Featured Cult">
        <div class="vf-feat">
          <span class="vf-feat-img vf-feat-soon" aria-hidden="true">&#10013;</span>
          <span class="vf-feat-name vf-muted">Cults land soon</span>
        </div>
      </VfPanel>
    </div>

    <VfPanel flush>
      <template #title>
        <div class="vf-tabs">
          <button
            v-for="t in tabs"
            :key="t.key"
            type="button"
            class="vf-tab"
            :class="{ 'vf-tab-on': tab === t.key }"
            @click="tab = t.key"
          >
            {{ t.label }}
          </button>
        </div>
      </template>

      <div v-show="tab === 'news'" class="vf-news">
        <article v-for="n in news" :key="n.title" class="vf-news-item">
          <span class="vf-news-mark" aria-hidden="true">&#10013;</span>
          <div>
            <p class="vf-news-title">{{ n.title }}</p>
            <p class="vf-news-body">{{ n.body }}</p>
          </div>
        </article>
      </div>

      <div v-show="tab === 'journals'">
        <VfJournalCard v-for="e in journals" :key="e.id" :entry="e" />
        <p v-if="!journals.length" class="vf-empty">No journals yet.</p>
      </div>

      <div v-show="tab === 'activity'">
        <ul class="vf-activity">
          <li v-for="s in activity" :key="s.id">
            <NuxtLink :to="`/${s.username}`" class="vf-act-author">{{
              s.displayName || s.username
            }}</NuxtLink>
            <span class="vf-act-body">{{ s.body }}</span>
            <span class="vf-act-when">{{ when(s.createdAt) }}</span>
          </li>
          <li v-if="!activity.length" class="vf-empty">Nothing posted yet.</li>
        </ul>
      </div>
    </VfPanel>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "vampirefreaks, goth and industrial network",
  meta: [
    {
      name: "description",
      content:
        "A revival of the VampireFreaks social network era. Profiles, ratings, cults, forums, journals, and music for the goth and industrial scene.",
    },
  ],
})

type Member = { username: string; displayName: string | null }
type Journal = {
  id: string
  title: string
  body: string
  mood: string | null
  commentCount: number
  createdAt: string
  username: string
  displayName: string | null
}
type Status = {
  id: string
  body: string
  createdAt: string
  username: string
  displayName: string | null
}

const [{ data: home }, { data: journals }, { data: activity }] = await Promise.all([
  useFetch<{ newest: Member[] }>("/api/home", { default: () => ({ newest: [] }) }),
  useFetch<Journal[]>("/api/feed/journals", { default: () => [] }),
  useFetch<Status[]>("/api/feed/site", { default: () => [] }),
])

const featuredMember = computed<Member | null>(() => home.value?.newest?.[0] ?? null)

const tabs = [
  { key: "news", label: "Site News" },
  { key: "journals", label: "Recent Journals" },
  { key: "activity", label: "Activity" },
]
const tab = ref("news")

const news = [
  {
    title: "vampirefreaks.net is open",
    body: "A homage to the VampireFreaks era, rebuilt. Claim a username, build a profile, and rate the scene.",
  },
  {
    title: "No premium, no store",
    body: "Every account is the same tier and moderation applies to everyone equally. The good parts of the era, none of the pay-to-skip-moderation.",
  },
  {
    title: "Journals are live",
    body: "Write entries, set them public, friends-only, or private, and comment on the ones you can see.",
  },
]

function when(v: string): string {
  return new Date(v).toLocaleString()
}
</script>

<style scoped>
.vf-featured {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.6rem;
}
@media (min-width: 560px) {
  .vf-featured {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
.vf-feat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}
.vf-feat-img {
  width: 100%;
  aspect-ratio: 1;
  max-height: 7rem;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-size: 2.6rem;
  color: var(--color-accent-text);
  background: var(--color-accent);
  border-radius: var(--radius-block);
  text-decoration: none;
}
.vf-feat-soon {
  background: var(--color-surface-2);
  color: var(--color-muted);
}
.vf-feat-name {
  font-weight: 700;
  color: var(--color-accent);
  text-decoration: none;
  font-size: 0.85rem;
  text-align: center;
}
.vf-muted {
  color: var(--color-muted);
  font-weight: 400;
}
.vf-feat-empty {
  color: var(--color-muted);
  font-style: italic;
  text-align: center;
}

.vf-tabs {
  display: flex;
  gap: 0.1rem;
}
.vf-tab {
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-muted);
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-block);
}
.vf-tab:hover {
  color: var(--color-text);
}
.vf-tab-on {
  color: var(--color-accent-text);
  background: var(--color-accent);
}

.vf-news-item {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
}
.vf-news-item:last-child {
  border-bottom: none;
}
.vf-news-mark {
  color: var(--color-accent);
}
.vf-news-title {
  font-weight: 700;
  color: var(--color-accent);
  font-size: 0.9rem;
}
.vf-news-body {
  font-size: 0.82rem;
  color: var(--color-text);
}

.vf-activity {
  list-style: none;
  margin: 0;
  padding: 0;
}
.vf-activity > li {
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.84rem;
}
.vf-act-author {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 700;
  margin-right: 0.4rem;
}
.vf-act-when {
  margin-left: 0.4rem;
  font-size: 0.72rem;
  color: var(--color-muted);
}
.vf-empty {
  padding: 0.5rem 0.6rem;
  color: var(--color-muted);
  font-style: italic;
  font-size: 0.85rem;
}
</style>
