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
  titleTemplate: (title) => (title ? `${title} · vampirefreaks` : "vampirefreaks"),
  link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
  meta: [
    { property: "og:site_name", content: "vampirefreaks.net" },
    { property: "og:type", content: "website" },
    {
      property: "og:image",
      content: "https://vampirefreaks.sfo3.cdn.digitaloceanspaces.com/og.png",
    },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:image",
      content: "https://vampirefreaks.sfo3.cdn.digitaloceanspaces.com/og.png",
    },
  ],
})
</script>
