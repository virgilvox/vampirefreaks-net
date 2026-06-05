<template>
  <div class="jig-field flex flex-col gap-1.5">
    <label v-if="label" :for="htmlFor" class="font-display text-sm font-medium text-text">
      {{ label }}
    </label>
    <slot :id="htmlFor" :invalid="Boolean(error)" />
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>
    <p v-else-if="hint" class="text-sm text-muted">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
// Label, control, and message in one place so a form row is consistent and the
// label is wired to the control by id. Pass the control through the default
// slot; it receives the id to bind and whether the field is invalid.
const props = defineProps<{
  label?: string
  for?: string
  error?: string
  hint?: string
}>()

const htmlFor = computed(() => props.for ?? `field-${useId()}`)
</script>
