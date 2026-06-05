<template>
  <div class="flex flex-col gap-5">
    <form v-if="canManage" class="flex items-end gap-2" @submit.prevent="invite">
      <div class="flex-1">
        <UiFormField label="Invite by email" for="invite-email">
          <template #default="{ id }">
            <UiInput
              :id="id"
              v-model="inviteEmail"
              type="email"
              placeholder="teammate@example.com"
            />
          </template>
        </UiFormField>
      </div>
      <UiSelect v-model="inviteRole" :options="roleOptions" aria-label="Invite role" class="w-32" />
      <UiButton type="submit" :disabled="inviting || !inviteEmail.trim()">
        {{ inviting ? "Inviting..." : "Invite" }}
      </UiButton>
    </form>

    <div>
      <h3 class="mb-2 font-display text-sm font-semibold text-muted">Members</h3>
      <UiTable :columns="['Member', 'Role', '']">
        <tr v-for="m in members" :key="m.id">
          <td>
            {{ m.user.name || m.user.email }}
            <p v-if="m.user.name" class="text-sm text-muted">{{ m.user.email }}</p>
          </td>
          <td>
            <UiSelect
              v-if="canManage && m.role !== 'owner'"
              :model-value="m.role"
              :options="roleOptions"
              :aria-label="`Role for ${m.user.email}`"
              class="w-32"
              @update:model-value="(role) => changeRole(m, role)"
            />
            <span v-else class="text-muted">{{ m.role }}</span>
          </td>
          <td class="text-right">
            <UiButton
              v-if="canManage && m.role !== 'owner'"
              variant="ghost"
              @click="remove(m.user.email)"
            >
              Remove
            </UiButton>
          </td>
        </tr>
      </UiTable>
    </div>

    <div v-if="canManage && invites.length">
      <h3 class="mb-2 font-display text-sm font-semibold text-muted">Pending invitations</h3>
      <UiTable :columns="['Email', 'Role', '']">
        <tr v-for="inv in invites" :key="inv.id">
          <td>{{ inv.email }}</td>
          <td class="text-muted">{{ inv.role || "member" }}</td>
          <td class="text-right">
            <UiButton variant="ghost" @click="cancel(inv.id)">Cancel</UiButton>
          </td>
        </tr>
      </UiTable>
    </div>
  </div>
</template>

<script setup lang="ts">
type Member = { id: string; userId: string; role: string; user: { email: string; name: string } }
type Invite = { id: string; email: string; role: string | null; status: string }

const props = defineProps<{ organizationId: string }>()
const { push } = useToast()

// Read the cached session (the default layout populates it) to find the caller's
// role, so management controls only show to an owner or admin. The API enforces
// this too; hiding the controls keeps the UI from offering actions that 403.
const session = useNuxtData<{ user: { id: string } | null }>("current-session")
const currentUserId = computed<string>(() => session.data.value?.user?.id ?? "")

const members = ref<Member[]>([])
const invites = ref<Invite[]>([])
const inviteEmail = ref("")
const inviteRole = ref("member")
const inviting = ref(false)

const roleOptions = [
  { label: "Member", value: "member" },
  { label: "Admin", value: "admin" },
]

const myRole = computed<string>(
  () => members.value.find((m) => m.userId === currentUserId.value)?.role ?? "",
)
const canManage = computed<boolean>(() => myRole.value === "owner" || myRole.value === "admin")

async function load(): Promise<void> {
  const full = await authClient.organization.getFullOrganization({
    query: { organizationId: props.organizationId },
  })
  const data = full.data
  members.value = (data?.members ?? []) as Member[]
  invites.value = ((data?.invitations ?? []) as Invite[]).filter((i) => i.status === "pending")
}

onMounted(load)
watch(() => props.organizationId, load)

async function invite(): Promise<void> {
  const email = inviteEmail.value.trim()
  if (!email) return
  inviting.value = true
  const { error } = await authClient.organization.inviteMember({
    email,
    role: inviteRole.value as "member" | "admin",
    organizationId: props.organizationId,
  })
  inviting.value = false
  if (error) {
    push({
      title: "Could not invite",
      description: error.message ?? "They may already be a member.",
      variant: "danger",
    })
    return
  }
  inviteEmail.value = ""
  await load()
  push({ title: "Invitation sent" })
}

async function changeRole(member: Member, role: string | undefined): Promise<void> {
  if (!role || role === member.role) return
  const { error } = await authClient.organization.updateMemberRole({
    memberId: member.id,
    role: role as "member" | "admin",
    organizationId: props.organizationId,
  })
  if (error) {
    push({ title: "Could not change role", variant: "danger" })
  }
  await load()
}

async function remove(emailOrId: string): Promise<void> {
  const { error } = await authClient.organization.removeMember({
    memberIdOrEmail: emailOrId,
    organizationId: props.organizationId,
  })
  if (error) {
    push({ title: "Could not remove member", variant: "danger" })
    return
  }
  await load()
}

async function cancel(invitationId: string): Promise<void> {
  const { error } = await authClient.organization.cancelInvitation({ invitationId })
  if (error) {
    push({ title: "Could not cancel invitation", variant: "danger" })
    return
  }
  await load()
}
</script>
