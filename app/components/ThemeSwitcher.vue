<template>
  <UiSelect v-model="selected" :options="options" aria-label="Theme" class="w-44" />
</template>

<script setup lang="ts">
import type { ThemeName } from "../composables/useTheme"

// The whole theme-swap demo: pick a name, the data-theme attribute changes,
// the page retints. No component reads a color or font of its own.
const { theme, themes, setTheme } = useTheme()

const options = themes.map((name) => ({ label: name, value: name }))

const selected = computed<string>({
  get: () => theme.value,
  set: (value) => setTheme(value as ThemeName),
})
</script>
