<template>
  <div>
    <div class="pg-topology-selector">
      <label class="pg-topology-label">{{ layoutLabel }}:</label>
      <div class="pg-topology-buttons">
        <button
          v-for="topologyOption in TOPOLOGIES"
          :key="topologyOption.id"
          class="pg-topo-btn"
          :class="{ 'pg-topo-btn--active': activeTopology === topologyOption.id }"
          @click="$emit('update:topology', topologyOption.id)"
        >
          {{ topologyOption.icon }} {{ topologyOption.id }}
        </button>
      </div>
    </div>
    <div class="hint pg-layout-hint">{{ layoutHelp }}</div>

    <div v-if="showHeavyHint" class="pg-reset-recommended">
      <span class="hint">{{ heavyHint }}</span>
      <button
        type="button"
        class="pg-reset-btn"
        :title="resetRecommendedTitle"
        @click="$emit('reset-recommended')"
      >
        {{ resetRecommendedLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const TOPOLOGIES = [
  { id: "linear", icon: "⟶" },
  { id: "parallel", icon: "∥" },
  { id: "ring", icon: "↺" },
  { id: "mesh", icon: "⬡" },
] as const;

defineProps<{
  activeTopology: string;
  showHeavyHint: boolean;
  layoutLabel: string;
  layoutHelp: string;
  heavyHint: string;
  resetRecommendedLabel: string;
  resetRecommendedTitle: string;
}>();

defineEmits<{
  "update:topology": [value: string];
  "reset-recommended": [];
}>();
</script>

<style scoped>
.pg-topology-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0 8px;
  border-bottom: 1px solid var(--border, #333);
  margin-bottom: 8px;
}
.pg-topology-label {
  font-size: 10px;
  color: var(--text3, #666);
  user-select: none;
}
.pg-topology-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.pg-topo-btn {
  background: transparent;
  border: 1px solid var(--border, #444);
  border-radius: 4px;
  color: var(--text2, #aaa);
  font-size: 10px;
  padding: 2px 7px;
  cursor: pointer;
  transition: all 0.15s;
}
.pg-topo-btn:hover {
  border-color: #4dabf7;
  color: #4dabf7;
}
.pg-topo-btn--active {
  border-color: #4dabf7;
  color: #4dabf7;
  background: rgba(77, 171, 247, 0.1);
}

.pg-reset-recommended {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin: 8px 0;
  background: color-mix(in srgb, var(--warning) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--warning) 45%, transparent);
  border-radius: var(--radius);
  font-size: 12px;
  line-height: 1.45;
}
.pg-reset-recommended .hint {
  flex: 1;
  color: var(--warning);
  font-weight: 500;
  opacity: 1;
}
.pg-reset-btn {
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 600;
  background: var(--warning);
  border: 1px solid var(--warning);
  border-radius: var(--radius);
  color: #17110c;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    filter 0.15s,
    box-shadow 0.15s;
}
.pg-reset-btn:hover {
  filter: brightness(1.08);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--warning) 22%, transparent);
}
</style>
