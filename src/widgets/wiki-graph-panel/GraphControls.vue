<template>
  <div class="graph-controls">
    <input
      :value="search"
      class="graph-controls__search"
      :placeholder="t('wikiGraph.searchPlaceholder')"
      @input="emit('update:search', ($event.target as HTMLInputElement).value)"
    />
    <div class="graph-controls__legend">
      <div v-for="item in legend" :key="item.tag" class="graph-controls__legend-item">
        <span class="graph-controls__legend-dot" :style="{ background: item.color }" />
        <span class="graph-controls__legend-label">{{ item.tag }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

defineProps<{ search: string }>();
const emit = defineEmits<{ "update:search": [val: string] }>();
const { t } = useI18n();

const legend = [
  { tag: "architecture", color: "#4dabf7" },
  { tag: "feature", color: "#51cf66" },
  { tag: "api", color: "#cc5de8" },
  { tag: "agents", color: "#ff922b" },
  { tag: "log", color: "#868e96" },
];
</script>

<style scoped>
.graph-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg2, #1e2230);
  border-bottom: 1px solid var(--border, #2a2f3e);
}
.graph-controls__search {
  flex: 1;
  max-width: 240px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--bg, #161922);
  color: var(--text1, #c8cfe8);
  font-size: 12px;
}
.graph-controls__legend {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.graph-controls__legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text2, #9dadd0);
}
.graph-controls__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
