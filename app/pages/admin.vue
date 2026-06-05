<template>
  <section class="flex flex-col gap-3">
    <h1 class="vf-page-title">Moderation</h1>

    <VfPanel :title="`Open reports (${reports.length})`" flush>
      <ul class="vf-queue">
        <li v-for="r in reports" :key="r.id" class="vf-report">
          <div class="vf-report-main">
            <p class="vf-report-target">
              <a v-if="r.targetHref" :href="r.targetHref" class="vf-link">{{
                r.targetLabel || r.targetType
              }}</a>
              <span v-else>{{ r.targetLabel || r.targetType }}</span>
              <span class="vf-report-type">{{ r.targetType }}</span>
            </p>
            <p class="vf-report-reason">{{ r.reason }}</p>
            <p class="vf-report-meta">
              by {{ r.reporterUsername || "unknown" }} · {{ when(r.createdAt) }}
            </p>
          </div>
          <div class="vf-report-actions">
            <UiButton variant="surface" @click="resolve(r.id, 'dismissed')">Dismiss</UiButton>
            <UiButton variant="surface" @click="resolve(r.id, 'resolved')">Resolve</UiButton>
            <UiButton v-if="removable(r.targetType)" variant="danger" @click="remove(r)">
              Remove
            </UiButton>
            <UiButton v-if="r.targetType === 'profile'" variant="danger" @click="ban(r)"
              >Ban</UiButton
            >
          </div>
        </li>
        <li v-if="reports.length === 0" class="vf-empty">Nothing to review. Quiet night.</li>
      </ul>
    </VfPanel>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth", "admin"] })
useHead({ title: "Moderation" })
const { push } = useToast()

type Report = {
  id: string
  targetType: string
  targetId: string
  targetLabel: string | null
  targetHref: string | null
  reason: string
  createdAt: string
  reporterUsername: string | null
}

const cookieHeaders = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
const { data: reports, refresh } = await useFetch<Report[]>("/api/admin/reports", {
  default: () => [],
  headers: cookieHeaders,
})

function when(v: string): string {
  return new Date(v).toLocaleString()
}
function removable(type: string): boolean {
  return ["journal", "post", "cult", "thread"].includes(type)
}

async function resolve(id: string, status: "resolved" | "dismissed"): Promise<void> {
  await $fetch(`/api/admin/reports/${id}`, { method: "PATCH", body: { status } }).catch(() => null)
  await refresh()
}

async function remove(r: Report): Promise<void> {
  await $fetch("/api/admin/remove", {
    method: "POST",
    body: { targetType: r.targetType, targetId: r.targetId },
  }).catch(() => null)
  push({ title: "Content removed" })
  await refresh()
}

async function ban(r: Report): Promise<void> {
  // Profile reports carry the member's user id as the target.
  const res = await authClient.admin.banUser({ userId: r.targetId }).catch(() => null)
  if (res && "error" in res && res.error) {
    push({ title: "Could not ban", description: res.error.message ?? "", variant: "danger" })
    return
  }
  await resolve(r.id, "resolved")
  push({ title: "Member banned" })
}
</script>

<style scoped>
.vf-page-title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  color: var(--color-text);
}
.vf-queue {
  list-style: none;
  margin: 0;
  padding: 0;
}
.vf-report {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.6rem 0.7rem;
  border-bottom: 1px solid var(--color-border);
}
.vf-queue li:last-child {
  border-bottom: none;
}
.vf-report-main {
  min-width: 0;
}
.vf-report-target {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.vf-link {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 700;
}
.vf-link:hover {
  text-decoration: underline;
}
.vf-report-type {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-block);
  padding: 0 0.3rem;
}
.vf-report-reason {
  font-size: 0.85rem;
  margin-top: 0.15rem;
  white-space: pre-wrap;
}
.vf-report-meta {
  font-size: 0.72rem;
  color: var(--color-muted);
  margin-top: 0.15rem;
}
.vf-report-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  flex-shrink: 0;
}
.vf-empty {
  padding: 0.6rem;
  color: var(--color-muted);
  font-style: italic;
}
</style>
