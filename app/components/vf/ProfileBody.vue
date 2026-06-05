<template>
  <div :class="['vf-profile-body', scopeClass]" :style="containerStyle">
    <component :is="'style'" v-if="scopedCss">{{ scopedCss }}</component>
    <p v-if="bio" class="vf-bio">{{ bio }}</p>
    <p v-else class="vf-bio vf-bio-empty">This crypt is still empty.</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

// Renders a member's structured customization safely in the app origin. Colors,
// background, and font come from discrete fields; the bounded customCss was
// already sanitized on write (server/utils/sanitize) and is scoped to this
// container so it cannot restyle the rest of the app. Freeform HTML is the
// Phase 5 sandboxed-iframe path and is deliberately not rendered here.
const props = defineProps<{
  username: string
  bio?: string | null
  bgColor?: string | null
  textColor?: string | null
  linkColor?: string | null
  accentColor?: string | null
  bgImageUrl?: string | null
  fontChoice?: string | null
  customCss?: string | null
}>()

const FONT_MAP: Record<string, string> = {
  display: "var(--font-display)",
  body: "var(--font-body)",
  mono: "var(--font-mono)",
  serif: "Georgia, serif",
  system: "system-ui, sans-serif",
}

const scopeClass = computed(() => `vf-pb-${props.username.replace(/[^a-z0-9_]/g, "")}`)

const containerStyle = computed(() => {
  const s: Record<string, string> = {}
  if (props.bgColor) s.background = props.bgColor
  if (props.textColor) s.color = props.textColor
  const font = props.fontChoice ? FONT_MAP[props.fontChoice] : undefined
  if (font) s.fontFamily = font
  if (props.bgImageUrl) {
    s.backgroundImage = `url(${props.bgImageUrl})`
    s.backgroundSize = "cover"
    s.backgroundPosition = "center"
  }
  return s
})

// Wrap the member CSS in their scope class so every rule only reaches inside the
// profile body. Link and accent colors are exposed as overridable rules too.
const scopedCss = computed(() => {
  const scope = `.${scopeClass.value}`
  let css = ""
  if (props.linkColor) css += `${scope} a { color: ${props.linkColor}; }\n`
  if (props.accentColor) css += `${scope} { --vf-accent: ${props.accentColor}; }\n`
  if (props.customCss) {
    // Prefix each top-level selector with the scope so styles stay contained.
    css += props.customCss.replace(/(^|})\s*([^{}@]+)\{/g, (_m, brace: string, sel: string) => {
      const scoped = sel
        .split(",")
        .map((part) => `${scope} ${part.trim()}`)
        .join(", ")
      return `${brace} ${scoped} {`
    })
  }
  return css
})
</script>

<style scoped>
.vf-profile-body {
  border: 2px solid var(--color-border);
  border-radius: var(--radius-block);
  background: var(--color-surface);
  padding: 1.25rem;
  min-height: 8rem;
  /* Contain member CSS: clip overflow, hold absolute children to this box, and
     start a new stacking context so a high z-index cannot cover the app. */
  position: relative;
  overflow: hidden;
  isolation: isolate;
}
.vf-bio {
  white-space: pre-wrap;
  line-height: 1.5;
}
.vf-bio-empty {
  color: var(--color-muted);
  font-style: italic;
}
</style>
