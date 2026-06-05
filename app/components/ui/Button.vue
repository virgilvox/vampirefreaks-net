<template>
  <button :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue"

type Variant = "accent" | "surface" | "ghost" | "danger"

const props = withDefaults(
  defineProps<{
    variant?: Variant
    type?: "button" | "submit" | "reset"
    disabled?: boolean
    block?: boolean
  }>(),
  { variant: "accent", type: "button", disabled: false, block: false },
)

const base =
  "jig-button inline-flex items-center justify-center gap-2 font-display font-medium " +
  "rounded-block border-2 px-4 py-2 text-sm transition-transform " +
  "active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:pointer-events-none"

const variants: Record<Variant, string> = {
  accent: "bg-accent text-accent-text border-border shadow-block hover:opacity-90",
  surface: "bg-surface text-text border-border shadow-block hover:bg-surface-2",
  ghost: "bg-transparent text-text border-transparent hover:bg-surface-2",
  danger: "bg-danger text-danger-text border-border shadow-block hover:opacity-90",
}

const classes = computed(() => [base, variants[props.variant], props.block ? "w-full" : ""])
</script>
