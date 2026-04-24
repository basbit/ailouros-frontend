<template>
  <svg v-if="lines.length" class="topo-svg-overlay" :width="width" :height="height">
    <defs v-if="variant === 'ring'">
      <marker
        id="arrow-ring"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#4dabf7" />
      </marker>
    </defs>
    <path
      v-for="line in lines"
      :key="line.id"
      :d="line.d"
      :class="line.cssClass"
      :marker-end="variant === 'ring' ? 'url(#arrow-ring)' : undefined"
    />
  </svg>
</template>

<script setup lang="ts">
interface EdgeLine {
  id: string;
  d: string;
  cssClass: string;
}

defineProps<{
  lines: readonly EdgeLine[];
  width: number;
  height: number;
  variant: "ring" | "mesh";
}>();
</script>

<style scoped>
.topo-svg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
  overflow: visible;
}
:deep(.topo-conn-ring) {
  fill: none;
  stroke: #4dabf7;
  stroke-width: 1.5;
  stroke-dasharray: 6 3;
  opacity: 0.6;
}
:deep(.topo-conn-mesh) {
  fill: none;
  stroke: #7950f2;
  stroke-width: 0.8;
  stroke-dasharray: 4 4;
  opacity: 0.25;
}
</style>
