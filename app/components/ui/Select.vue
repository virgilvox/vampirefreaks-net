<template>
  <SelectRoot v-model="model">
    <SelectTrigger
      :aria-label="ariaLabel"
      class="jig-select-trigger inline-flex w-full items-center justify-between gap-2 rounded-block border-2 border-border bg-surface px-3 py-2 text-text data-[placeholder]:text-muted"
    >
      <SelectValue :placeholder="placeholder" />
      <SelectIcon class="text-muted">▾</SelectIcon>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        :side-offset="6"
        position="popper"
        class="jig-select-content z-50 min-w-[var(--reka-select-trigger-width)] overflow-hidden rounded-block border-2 border-border bg-surface text-text shadow-block"
      >
        <SelectViewport class="p-1">
          <SelectItem
            v-for="opt in options"
            :key="opt.value"
            :value="opt.value"
            class="jig-select-item flex cursor-pointer items-center justify-between rounded-block px-3 py-2 text-sm data-[highlighted]:bg-surface-2 data-[highlighted]:outline-none"
          >
            <SelectItemText>{{ opt.label }}</SelectItemText>
            <SelectItemIndicator class="text-accent">✓</SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<script setup lang="ts">
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from "reka-ui"

export type SelectOption = { label: string; value: string }

const model = defineModel<string>()

withDefaults(
  defineProps<{
    options: SelectOption[]
    placeholder?: string
    ariaLabel?: string
  }>(),
  { placeholder: "Select...", ariaLabel: "Select an option" },
)
</script>
