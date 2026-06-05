<template>
  <section class="flex flex-col gap-6">
    <div>
      <h1 class="font-display text-3xl font-bold">Organizations</h1>
      <p class="text-muted">
        Multi-tenant primitives. Optional, and off the notes app's path until you wire your data to
        the active organization.
      </p>
    </div>

    <MyInvitations @changed="load" />

    <UiCard title="Create an organization">
      <form class="flex items-end gap-2" @submit.prevent="create">
        <div class="flex-1">
          <UiFormField label="Name" for="org-name" :hint="`Slug: ${previewSlug || '...'}`">
            <template #default="{ id }">
              <UiInput :id="id" v-model="name" placeholder="Acme Inc" required />
            </template>
          </UiFormField>
        </div>
        <UiButton type="submit" :disabled="creating || !name.trim()">
          {{ creating ? "Creating..." : "Create" }}
        </UiButton>
      </form>
    </UiCard>

    <UiCard title="Your organizations">
      <UiTable v-if="orgs.length" :columns="['Name', 'Slug', '']">
        <tr v-for="org in orgs" :key="org.id">
          <td>{{ org.name }}</td>
          <td class="font-mono text-muted">{{ org.slug }}</td>
          <td class="text-right">
            <span v-if="org.id === activeId" class="text-sm text-success">Active</span>
            <UiButton v-else variant="ghost" @click="setActive(org.id)">Set active</UiButton>
          </td>
        </tr>
      </UiTable>
      <p v-else class="text-muted">No organizations yet. Create one above.</p>
    </UiCard>

    <UiCard v-if="activeId" title="Members" subtitle="Manage the active organization.">
      <OrgMembers :organization-id="activeId" />
    </UiCard>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" })
useHead({ title: "Organizations" })

type Org = { id: string; name: string; slug: string }

const { push } = useToast()
const orgs = ref<Org[]>([])
const activeId = ref<string>("")
const name = ref("")
const creating = ref(false)

const previewSlug = computed<string>(() => slugify(name.value))

async function load(): Promise<void> {
  const { data } = await authClient.organization.list()
  orgs.value = data ?? []
  const active = await authClient.organization.getFullOrganization()
  activeId.value = active.data?.id ?? ""
}

// Organizations live behind the session, so load after mount.
onMounted(load)

async function create(): Promise<void> {
  const trimmed = name.value.trim()
  if (!trimmed) return
  creating.value = true
  const { error } = await authClient.organization.create({ name: trimmed, slug: slugify(trimmed) })
  creating.value = false
  if (error) {
    push({
      title: "Could not create organization",
      description: error.message ?? "The slug may already be taken.",
      variant: "danger",
    })
    return
  }
  name.value = ""
  await load()
  push({ title: "Organization created" })
}

async function setActive(organizationId: string): Promise<void> {
  const { error } = await authClient.organization.setActive({ organizationId })
  if (error) {
    push({ title: "Could not set active organization", variant: "danger" })
    return
  }
  activeId.value = organizationId
}
</script>
