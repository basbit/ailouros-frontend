<template>
  <svg
    class="sparkline"
    :viewBox="`0 0 ${width} ${height}`"
    :width="width"
    :height="height"
    role="img"
    :aria-label="ariaLabel"
  >
    <polyline
      v-if="linePoints"
      class="sparkline__line"
      :points="linePoints"
      fill="none"
    />
    <rect
      v-for="(bar, idx) in barPoints"
      :key="idx"
      class="sparkline__bar"
      :x="bar.x"
      :y="bar.y"
      :width="bar.width"
      :height="bar.height"
    />
    <circle
      v-if="lastDot"
      class="sparkline__dot"
      :cx="lastDot.cx"
      :cy="lastDot.cy"
      r="2"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";

defineOptions({ name: "ObservabilitySparkline" });

const props = withDefaults(
  defineProps<{
    values: Array<number | null>;
    mode?: "line" | "bar";
    width?: number;
    height?: number;
    ariaLabel?: string;
  }>(),
  { mode: "line", width: 140, height: 32, ariaLabel: "sparkline" },
);

const cleanedValues = computed<number[]>(() => {
  if (!Array.isArray(props.values) || !props.values.length) return [];
  const stripped = props.values.map((value) =>
    typeof value === "number" && Number.isFinite(value) ? value : 0,
  );
  return stripped;
});

const range = computed(() => {
  const values = cleanedValues.value;
  if (!values.length) return { min: 0, max: 1 };
  const min = Math.min(...values, 0);
  const max = Math.max(...values, min + 1);
  return { min, max };
});

function project(value: number, idx: number, total: number): { x: number; y: number } {
  const padding = 2;
  const span = Math.max(props.width - padding * 2, 1);
  const x = total === 1 ? props.width / 2 : padding + (idx / (total - 1)) * span;
  const yRange = Math.max(props.height - padding * 2, 1);
  const { min, max } = range.value;
  const norm = max - min === 0 ? 0.5 : (value - min) / (max - min);
  const y = padding + (1 - norm) * yRange;
  return { x, y };
}

const linePoints = computed(() => {
  if (props.mode !== "line") return null;
  const values = cleanedValues.value;
  if (!values.length) return null;
  return values
    .map((value, idx) => {
      const point = project(value, idx, values.length);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    })
    .join(" ");
});

const barPoints = computed(() => {
  if (props.mode !== "bar") return [];
  const values = cleanedValues.value;
  if (!values.length) return [];
  const padding = 2;
  const span = Math.max(props.width - padding * 2, 1);
  const slot = span / values.length;
  const barWidth = Math.max(slot * 0.7, 1);
  const yRange = Math.max(props.height - padding * 2, 1);
  const { min, max } = range.value;
  return values.map((value, idx) => {
    const norm = max - min === 0 ? 0.5 : (value - min) / (max - min);
    const barHeight = Math.max(yRange * norm, 1);
    return {
      x: padding + idx * slot + (slot - barWidth) / 2,
      y: padding + (yRange - barHeight),
      width: barWidth,
      height: barHeight,
    };
  });
});

const lastDot = computed(() => {
  if (props.mode !== "line") return null;
  const values = cleanedValues.value;
  if (!values.length) return null;
  const point = project(values[values.length - 1], values.length - 1, values.length);
  return { cx: point.x, cy: point.y };
});
</script>

<style scoped>
.sparkline {
  display: block;
}
.sparkline__line {
  stroke: var(--accent, #3b5bdb);
  stroke-width: 1.4;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.sparkline__bar {
  fill: color-mix(in srgb, var(--accent, #3b5bdb) 65%, transparent);
}
.sparkline__dot {
  fill: var(--accent, #3b5bdb);
}
</style>
