<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// Applies the theme attribute app-wide and sets the title suffix. Everything
// visible lives in layouts and pages.
useTheme()
useHead({
  htmlAttrs: { lang: "en" },
  titleTemplate: (title) => (title ? `${title} · JIG` : "JIG"),
})
</script>
