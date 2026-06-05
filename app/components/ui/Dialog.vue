<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="jig-dialog-overlay fixed inset-0 z-40 bg-black/50" />
      <DialogContent
        class="jig-dialog-content fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-block border-2 border-border bg-surface p-5 text-text shadow-block focus:outline-none"
      >
        <DialogTitle class="font-display text-lg font-semibold">{{ title }}</DialogTitle>
        <DialogDescription v-if="description" class="mt-1 text-sm text-muted">
          {{ description }}
        </DialogDescription>

        <div class="mt-4">
          <slot />
        </div>

        <div v-if="$slots.footer" class="mt-5 flex justify-end gap-2">
          <slot name="footer" />
        </div>

        <DialogClose
          aria-label="Close"
          class="absolute right-3 top-3 rounded-block px-2 py-1 text-muted hover:bg-surface-2"
        >
          ✕
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "reka-ui"

const open = defineModel<boolean>("open", { default: false })

defineProps<{ title: string; description?: string }>()
</script>
