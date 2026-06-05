<template>
  <input
    :id="id"
    v-model="model"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :autocomplete="autocomplete"
    :aria-invalid="invalid || undefined"
    class="jig-input w-full rounded-block border-2 border-border bg-surface px-3 py-2 text-text placeholder:text-muted aria-[invalid]:border-danger disabled:opacity-50"
  />
</template>

<script setup lang="ts">
const model = defineModel<string>({ default: "" })

withDefaults(
  defineProps<{
    id?: string
    type?: string
    placeholder?: string
    disabled?: boolean
    required?: boolean
    invalid?: boolean
    autocomplete?: string
  }>(),
  { type: "text", disabled: false, required: false, invalid: false },
)
</script>
