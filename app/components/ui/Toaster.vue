<template>
  <ToastProvider>
    <ToastRoot
      v-for="toast in toasts"
      :key="toast.id"
      :open="true"
      class="jig-toast rounded-block border-2 border-border bg-surface p-4 text-text shadow-block data-[state=closed]:opacity-0"
      :class="toast.variant === 'danger' ? 'border-danger' : ''"
      @update:open="(value) => !value && dismiss(toast.id)"
    >
      <ToastTitle class="font-display text-sm font-semibold">{{ toast.title }}</ToastTitle>
      <ToastDescription v-if="toast.description" class="mt-1 text-sm text-muted">
        {{ toast.description }}
      </ToastDescription>
      <ToastClose aria-label="Dismiss" class="absolute right-2 top-2 text-muted hover:text-text">
        ✕
      </ToastClose>
    </ToastRoot>

    <ToastViewport
      class="jig-toast-viewport fixed bottom-0 right-0 z-50 flex w-96 max-w-[100vw] flex-col gap-2 p-4"
    />
  </ToastProvider>
</template>

<script setup lang="ts">
import {
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport,
} from "reka-ui"

// Single host placed once in the default layout. Renders whatever useToast()
// has queued. Components push toasts; this turns them into accessible alerts.
const { toasts, dismiss } = useToast()
</script>
