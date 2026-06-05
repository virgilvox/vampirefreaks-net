<template>
  <div class="vf-rating">
    <div class="vf-rating-row" role="group" :aria-label="`Rate this profile 1 to 10`">
      <button
        v-for="n in 10"
        :key="n"
        type="button"
        class="vf-drop"
        :class="{
          'vf-drop-on': n <= hovered,
          'vf-drop-yours': !hovered && yourScore != null && n <= yourScore,
        }"
        :disabled="disabled"
        :aria-label="`Rate ${n} of 10`"
        :aria-pressed="yourScore === n"
        @mouseenter="hovered = n"
        @mouseleave="hovered = 0"
        @focus="hovered = n"
        @blur="hovered = 0"
        @click="emit('rate', n)"
      >
        <span aria-hidden="true">&#9830;</span>
      </button>
    </div>
    <p class="vf-rating-meta">
      <template v-if="average != null">
        <span class="vf-rating-avg">{{ average.toFixed(1) }}</span>
        <span class="vf-rating-count"
          >from {{ ratingCount ?? 0 }} {{ ratingCount === 1 ? "rating" : "ratings" }}</span
        >
      </template>
      <template v-else>
        <span class="vf-rating-count">No ratings yet</span>
      </template>
      <span v-if="yourScore != null" class="vf-rating-yours">you: {{ yourScore }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"

withDefaults(
  defineProps<{
    average?: number | null
    ratingCount?: number | null
    yourScore?: number | null
    disabled?: boolean
  }>(),
  { average: null, ratingCount: 0, yourScore: null, disabled: false },
)

const emit = defineEmits<{ rate: [score: number] }>()
const hovered = ref(0)
</script>

<style scoped>
.vf-rating {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.vf-rating-row {
  display: flex;
  gap: 0.125rem;
}
.vf-drop {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0.1rem;
  color: var(--color-border);
  transition: transform 0.05s ease;
}
.vf-drop:not(:disabled):hover {
  transform: scale(1.15);
}
.vf-drop:disabled {
  cursor: default;
}
.vf-drop-yours {
  color: var(--color-muted);
}
.vf-drop-on {
  color: var(--color-accent);
}
.vf-rating-meta {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-muted);
}
.vf-rating-avg {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--color-accent);
}
.vf-rating-yours {
  margin-left: auto;
}
</style>
