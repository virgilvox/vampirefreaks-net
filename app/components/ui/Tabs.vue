<template>
  <TabsRoot v-model="model" class="jig-tabs flex flex-col gap-4">
    <TabsList class="jig-tabs-list flex gap-1 border-b-2 border-border" aria-label="Tabs">
      <TabsTrigger
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        class="jig-tabs-trigger -mb-0.5 border-b-2 border-transparent px-4 py-2 font-display text-sm text-muted data-[state=active]:border-accent data-[state=active]:text-text"
      >
        {{ tab.label }}
      </TabsTrigger>
    </TabsList>

    <TabsContent v-for="tab in tabs" :key="tab.value" :value="tab.value" class="focus:outline-none">
      <slot :name="tab.value" />
    </TabsContent>
  </TabsRoot>
</template>

<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "reka-ui"

export type Tab = { value: string; label: string }

const model = defineModel<string>()

defineProps<{ tabs: Tab[] }>()
</script>
