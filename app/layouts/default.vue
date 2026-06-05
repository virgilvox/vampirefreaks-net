<template>
  <div class="vf-shell">
    <header class="vf-top">
      <div class="vf-top-inner">
        <NuxtLink to="/" class="vf-logo">
          Vampire<span class="vf-logo-v">V</span>Freaks<small>.net</small>
        </NuxtLink>

        <div class="vf-top-right">
          <nav class="vf-quick">
            <NuxtLink to="/top">Browse Users</NuxtLink>
            <span>|</span>
            <NuxtLink to="/cults">Cults</NuxtLink>
            <span>|</span>
            <NuxtLink to="/forum">Messageboard</NuxtLink>
          </nav>
          <div class="vf-counts">
            <span class="vf-freakcount"
              >FREAK COUNT: <b>{{ freakCount }}</b></span
            >
            <span class="vf-online">{{ chrome?.stats.online ?? 0 }} online</span>
          </div>
        </div>
      </div>

      <nav class="vf-mainnav">
        <NuxtLink to="/">HOME</NuxtLink>
        <NuxtLink to="/top">PROFILES</NuxtLink>
        <NuxtLink :to="friendsLink">FRIENDS</NuxtLink>
        <NuxtLink to="/journals">JOURNALS</NuxtLink>
        <NuxtLink to="/cults">CULTS</NuxtLink>
        <NuxtLink :to="picsLink">PICS</NuxtLink>
        <NuxtLink to="/bands">MUSIC</NuxtLink>
        <NuxtLink to="/events">EVENTS</NuxtLink>
        <NuxtLink to="/about">SITE</NuxtLink>
      </nav>
    </header>

    <div class="vf-body">
      <aside class="vf-col vf-left">
        <VfPanel flush>
          <template v-if="profile">
            <div class="vf-me">
              <span class="vf-me-avatar" aria-hidden="true">{{ meInitial }}</span>
              <div>
                <NuxtLink :to="`/${profile.username}`" class="vf-me-name">{{
                  profile.username
                }}</NuxtLink>
                <button type="button" class="vf-me-status" @click="statusOpen = true">
                  Update Status
                </button>
              </div>
            </div>
            <ul class="vf-side-links">
              <li><NuxtLink to="/messages">Inbox</NuxtLink></li>
              <li><NuxtLink to="/account/requests">Friend Requests</NuxtLink></li>
              <li><NuxtLink to="/forum">Messageboard</NuxtLink></li>
              <li><NuxtLink :to="`/${profile.username}/journal`">My Journal</NuxtLink></li>
              <li><NuxtLink :to="`/${profile.username}`">My Profile</NuxtLink></li>
              <li><NuxtLink to="/cults">My Cults</NuxtLink></li>
              <li><NuxtLink to="/account">Edit Profile</NuxtLink></li>
              <li v-if="isStaff"><NuxtLink to="/admin">Moderation</NuxtLink></li>
              <li><button type="button" @click="logout">Logout</button></li>
            </ul>
          </template>

          <template v-else>
            <div class="vf-join">
              <p class="vf-join-h">Welcome to the crypt.</p>
              <p class="vf-join-p">Make a profile, get rated, find your people.</p>
              <NuxtLink to="/signup"><UiButton block>Join the night</UiButton></NuxtLink>
              <NuxtLink to="/login" class="vf-join-login">Already a freak? Log in</NuxtLink>
            </div>
          </template>
        </VfPanel>
      </aside>

      <main class="vf-col vf-main">
        <slot />
      </main>

      <aside class="vf-col vf-right">
        <VfPanel title="Top Cults" flush>
          <ul class="vf-rail">
            <li v-for="c in chrome?.topCults ?? []" :key="c.slug">
              <NuxtLink :to="`/cults/${c.slug}`">{{ c.name }}</NuxtLink>
            </li>
            <li v-if="!chrome?.topCults?.length" class="vf-rail-empty">No cults yet.</li>
          </ul>
        </VfPanel>

        <VfPanel title="Top Journals" flush>
          <ul class="vf-rail">
            <li v-for="j in chrome?.topJournals ?? []" :key="j.id">
              <NuxtLink :to="`/${j.username}/journal/${j.id}`">{{ j.title }}</NuxtLink>
            </li>
            <li v-if="!chrome?.topJournals?.length" class="vf-rail-empty">No journals yet.</li>
          </ul>
        </VfPanel>

        <VfPanel title="Newest Freaks" flush>
          <ul class="vf-rail">
            <li v-for="m in chrome?.newest ?? []" :key="m.username">
              <NuxtLink :to="`/${m.username}`">{{ m.displayName || m.username }}</NuxtLink>
            </li>
            <li v-if="!chrome?.newest?.length" class="vf-rail-empty">Be the first.</li>
          </ul>
        </VfPanel>
      </aside>
    </div>

    <footer class="vf-footer">
      <NuxtLink to="/about">About</NuxtLink>
      <NuxtLink to="/guidelines">Community Guidelines</NuxtLink>
      <NuxtLink to="/terms">Terms</NuxtLink>
      <NuxtLink to="/privacy">Privacy</NuxtLink>
      <span class="vf-footer-note"
        >A homage to the goth and industrial era, rebuilt. No store, no premium.</span
      >
    </footer>

    <VfStatusDialog v-model:open="statusOpen" @posted="onStatusPosted" />
    <UiToaster />
  </div>
</template>

<script setup lang="ts">
const { user, refresh } = await useCurrentUser()
const { profile } = await useProfile()

const isStaff = computed(() => (user.value as { role?: string } | null)?.role === "admin")

type Chrome = {
  stats: { members: number; online: number }
  topCults: Array<{ slug: string; name: string }>
  topJournals: Array<{ id: string; title: string; username: string }>
  newest: Array<{ username: string; displayName: string | null }>
}
const { data: chrome, refresh: refreshChrome } = await useFetch<Chrome>("/api/chrome", {
  key: "chrome",
  default: () => ({ stats: { members: 0, online: 0 }, topCults: [], topJournals: [], newest: [] }),
})

const freakCount = computed(() => (chrome.value?.stats.members ?? 0).toLocaleString())
const meInitial = computed(() => (profile.value?.username ?? "?").charAt(0).toUpperCase())
const friendsLink = computed(() => (profile.value ? `/${profile.value.username}/friends` : "/top"))
const picsLink = computed(() => (profile.value ? `/${profile.value.username}/gallery` : "/top"))

const statusOpen = ref(false)
async function onStatusPosted(): Promise<void> {
  statusOpen.value = false
  await refreshChrome()
}

async function logout(): Promise<void> {
  await authClient.signOut()
  await refresh()
  await navigateTo("/login")
}
</script>

<style scoped>
.vf-shell {
  min-height: 100vh;
  background-color: var(--color-bg);
  background-image:
    repeating-linear-gradient(45deg, var(--color-texture) 0 1px, transparent 1px 7px),
    repeating-linear-gradient(-45deg, var(--color-texture) 0 1px, transparent 1px 7px);
  color: var(--color-text);
  display: flex;
  flex-direction: column;
}

/* Top bar */
.vf-top {
  border-bottom: 2px solid var(--color-accent);
  background: linear-gradient(180deg, var(--color-topbar-from), var(--color-topbar-to));
}
.vf-top-inner {
  max-width: 1040px;
  margin: 0 auto;
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.vf-logo {
  font-family: var(--font-display);
  font-size: 2.4rem;
  line-height: 1;
  color: var(--color-logo);
  text-decoration: none;
  letter-spacing: 0.01em;
}
.vf-logo-v {
  color: var(--color-accent);
}
.vf-logo small {
  font-family: var(--font-body);
  font-size: 0.7rem;
  color: var(--color-muted);
  vertical-align: super;
}
.vf-top-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}
.vf-quick {
  display: flex;
  gap: 0.4rem;
  font-size: 0.72rem;
}
.vf-quick a {
  color: var(--color-text);
  text-decoration: none;
}
.vf-quick a:hover {
  color: var(--color-accent);
}
.vf-quick span {
  color: var(--color-border);
}
.vf-counts {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.78rem;
}
.vf-freakcount {
  font-family: var(--font-display);
  color: var(--color-accent);
  letter-spacing: 0.03em;
}
.vf-freakcount b {
  color: var(--color-accent-bright);
}
.vf-online {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-block);
  padding: 0.05rem 0.4rem;
  color: var(--color-muted);
}

/* Main nav */
.vf-mainnav {
  max-width: 1040px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem;
  padding: 0 0.5rem 0.4rem;
}
.vf-mainnav a {
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-text);
  text-decoration: none;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-block);
}
.vf-mainnav a:hover {
  color: var(--color-accent-text);
  background: var(--color-accent);
}
.vf-mainnav a.router-link-exact-active {
  color: var(--color-accent);
}

/* Three-column body */
.vf-body {
  max-width: 1040px;
  width: 100%;
  margin: 0.75rem auto;
  padding: 0 0.5rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.6rem;
}
@media (min-width: 900px) {
  .vf-body {
    grid-template-columns: 190px minmax(0, 1fr) 190px;
  }
}
.vf-col {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
}

/* Left member card */
.vf-me {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.6rem;
  border-bottom: 1px solid var(--color-border);
}
.vf-me-avatar {
  width: 2.4rem;
  height: 2.4rem;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  background: var(--color-accent);
  color: var(--color-accent-text);
  border-radius: var(--radius-block);
}
.vf-me-name {
  display: block;
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
}
.vf-me-status {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.72rem;
  color: var(--color-muted);
  cursor: pointer;
}
.vf-me-status:hover {
  color: var(--color-accent);
}
.vf-side-links {
  list-style: none;
  margin: 0;
  padding: 0.3rem 0;
}
.vf-side-links li a,
.vf-side-links li button {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.8rem;
  color: var(--color-accent);
  text-decoration: none;
  padding: 0.18rem 0.6rem;
}
.vf-side-links li a:hover,
.vf-side-links li button:hover {
  background: var(--color-surface-2);
}

/* Join card */
.vf-join {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.7rem;
}
.vf-join-h {
  font-family: var(--font-display);
  font-size: 1.3rem;
  color: var(--color-accent);
}
.vf-join-p {
  font-size: 0.8rem;
  color: var(--color-muted);
}
.vf-join-login {
  font-size: 0.75rem;
  color: var(--color-muted);
  text-align: center;
}

/* Right rails */
.vf-rail {
  list-style: none;
  margin: 0;
  padding: 0.2rem 0;
}
.vf-rail li a {
  display: block;
  font-size: 0.8rem;
  color: var(--color-text);
  text-decoration: none;
  padding: 0.16rem 0.6rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vf-rail li a:hover {
  color: var(--color-accent);
  background: var(--color-surface-2);
}
.vf-rail-empty {
  padding: 0.3rem 0.6rem;
  font-size: 0.76rem;
  color: var(--color-muted);
  font-style: italic;
}

/* Footer */
.vf-footer {
  margin-top: auto;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  padding: 0.6rem 0.75rem;
  font-size: 0.75rem;
}
.vf-footer a {
  color: var(--color-muted);
  text-decoration: none;
}
.vf-footer a:hover {
  color: var(--color-accent);
}
.vf-footer-note {
  margin-left: auto;
  color: var(--color-muted);
}
</style>
