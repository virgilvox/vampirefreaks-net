<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        :side-offset="6"
        align="end"
        class="jig-dropdown-content z-50 min-w-44 rounded-block border-2 border-border bg-surface p-1 text-text shadow-block"
      >
        <template v-for="(item, index) in items" :key="index">
          <DropdownMenuSeparator v-if="item.separator" class="my-1 h-px bg-border" />
          <DropdownMenuItem
            v-else
            :disabled="item.disabled"
            class="jig-dropdown-item flex cursor-pointer items-center gap-2 rounded-block px-3 py-2 text-sm data-[highlighted]:bg-surface-2 data-[highlighted]:outline-none data-[disabled]:opacity-50"
            :class="item.danger ? 'text-danger' : ''"
            @select="item.onSelect?.()"
          >
            {{ item.label }}
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "reka-ui"

export type DropdownItem = {
  label?: string
  onSelect?: () => void
  disabled?: boolean
  danger?: boolean
  separator?: boolean
}

defineProps<{ items: DropdownItem[] }>()
</script>
