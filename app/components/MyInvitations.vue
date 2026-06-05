<template>
  <UiCard v-if="invites.length" title="Invitations for you">
    <UiTable :columns="['Organization', 'Role', '']">
      <tr v-for="inv in invites" :key="inv.id">
        <td>{{ inv.organizationName || "An organization" }}</td>
        <td class="text-muted">{{ inv.role || "member" }}</td>
        <td>
          <div class="flex justify-end gap-2">
            <UiButton variant="ghost" @click="reject(inv.id)">Decline</UiButton>
            <UiButton @click="accept(inv.id)">Accept</UiButton>
          </div>
        </td>
      </tr>
    </UiTable>
  </UiCard>
</template>

<script setup lang="ts">
// Invitations the signed-in user has received, across organizations, so they
// can accept in-app without the email link. Emits "changed" after accepting so
// the parent can refresh its organization list.
type UserInvite = { id: string; role: string | null; status: string; organizationName?: string }

const emit = defineEmits<{ changed: [] }>()
const { push } = useToast()
const invites = ref<UserInvite[]>([])

async function load(): Promise<void> {
  const { data } = await authClient.organization.listUserInvitations()
  invites.value = ((data ?? []) as UserInvite[]).filter((i) => i.status === "pending")
}

onMounted(load)

async function accept(invitationId: string): Promise<void> {
  const { error } = await authClient.organization.acceptInvitation({ invitationId })
  if (error) {
    push({ title: "Could not accept", description: error.message ?? "", variant: "danger" })
    return
  }
  await load()
  emit("changed")
  push({ title: "Invitation accepted" })
}

async function reject(invitationId: string): Promise<void> {
  const { error } = await authClient.organization.rejectInvitation({ invitationId })
  if (error) {
    push({ title: "Could not decline", variant: "danger" })
    return
  }
  await load()
  push({ title: "Invitation declined" })
}
</script>
