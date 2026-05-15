<template>
  <div class="host-chart" :aria-label="t('hostMetrics.chart.ariaLabel')" role="img">
    <div class="host-chart__head">
      <span class="host-chart__title">{{ t("hostMetrics.chart.title") }}</span>
      <span v-if="!hasAnyData" class="host-chart__hint">
        {{ t("hostMetrics.chart.collecting") }}
      </span>
      <span v-else class="host-chart__hint">
        {{ t("hostMetrics.chart.window", { seconds: windowSeconds }) }}
      </span>
    </div>

    <svg
      v-if="hasAnyData"
      class="host-chart__svg"
      :viewBox="`0 0 ${width} ${height}`"
      preserveAspectRatio="none"
    >
      <!-- 25/50/75% guides -->
      <line
        v-for="g in guides"
        :key="g.y"
        :x1="0"
        :x2="width"
        :y1="g.y"
        :y2="g.y"
        class="host-chart__guide"
      />
      <path
        v-if="cpuPath"
        :d="cpuPath"
        class="host-chart__line host-chart__line--cpu"
      />
      <path
        v-if="memPath"
        :d="memPath"
        class="host-chart__line host-chart__line--mem"
      />
      <path
        v-if="gpuPath"
        :d="gpuPath"
        class="host-chart__line host-chart__line--gpu"
      />
    </svg>
    <div v-else class="host-chart__placeholder" />

    <div class="host-chart__legend">
      <span class="host-chart__legend-item host-chart__legend-item--cpu">
        <span class="host-chart__swatch host-chart__swatch--cpu" />
        {{ t("hostMetrics.cpu") }}
        <span v-if="latest.cpu != null" class="host-chart__legend-val">
          {{ Math.round(latest.cpu) }}%
        </span>
      </span>
      <span class="host-chart__legend-item host-chart__legend-item--mem">
        <span class="host-chart__swatch host-chart__swatch--mem" />
        {{ t("hostMetrics.memory") }}
        <span v-if="latest.mem != null" class="host-chart__legend-val">
          {{ Math.round(latest.mem) }}%
        </span>
      </span>
      <span v-if="hasGpu" class="host-chart__legend-item host-chart__legend-item--gpu">
        <span class="host-chart__swatch host-chart__swatch--gpu" />
        {{ gpuLabel }}
        <span v-if="latest.gpu != null" class="host-chart__legend-val">
          {{ Math.round(latest.gpu) }}%
        </span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * HostMetricsChart — inline sparkline of CPU / RAM / GPU utilisation across
 * the lifetime of the current task.
 *
 * Why SVG and not a chart library: this widget plots ≤ 3 lines × ≤ 120
 * points, refreshes once per second, and lives next to other 11-px-font
 * orchestrator widgets. A 50 KB chart library (chart.js, ECharts, …) is
 * overkill — manual path strings are ~30 LoC and render at 60 fps with
 * zero allocation churn.
 *
 * The component is fully reactive: it reads `ui.hostMetricsHistory` (ring
 * buffer maintained in the store on every WS tick) and recomputes paths
 * on change. The GPU line is hidden entirely if every sample in the
 * current window has `gpu === null` — Macs / hosts without an NVIDIA card
 * see a clean CPU+RAM chart instead of a confusing flat zero line.
 */
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type { HostMetricsSample } from "@/shared/store/ui";

const props = withDefaults(
  defineProps<{
    samples: HostMetricsSample[];
    gpuName?: string | null;
    /** Px — fixed width works because we letterbox via preserveAspectRatio. */
    width?: number;
    height?: number;
  }>(),
  { width: 240, height: 64, gpuName: null },
);

const { t } = useI18n();

const width = computed(() => props.width);
const height = computed(() => props.height);

const hasAnyData = computed(() => props.samples.length >= 2);

const hasGpu = computed(() =>
  props.samples.some((s) => typeof s.gpu === "number" && s.gpu !== null),
);

const gpuLabel = computed(() =>
  props.gpuName ? `GPU · ${props.gpuName}` : t("hostMetrics.chart.gpu"),
);

const latest = computed<HostMetricsSample>(() => {
  const buf = props.samples;
  return buf.length ? buf[buf.length - 1] : { t: 0, cpu: null, mem: null, gpu: null };
});

const windowSeconds = computed(() => {
  const buf = props.samples;
  if (buf.length < 2) return 0;
  return Math.round((buf[buf.length - 1].t - buf[0].t) / 1000);
});

const guides = computed(() =>
  [25, 50, 75].map((pct) => ({
    pct,
    y: ((100 - pct) / 100) * height.value,
  })),
);

/**
 * Build an SVG path with explicit M/L segments. We never bridge across
 * `null` samples — a missing reading breaks the line so the user can
 * tell "collector was down" from "load actually dropped to zero".
 */
function buildPath(values: (number | null)[]): string {
  const n = values.length;
  if (n < 2) return "";
  const w = width.value;
  const h = height.value;
  const stepX = n > 1 ? w / (n - 1) : 0;
  let path = "";
  let penDown = false;
  for (let i = 0; i < n; i += 1) {
    const v = values[i];
    if (v == null || !Number.isFinite(v)) {
      penDown = false;
      continue;
    }
    const clamped = Math.max(0, Math.min(100, v));
    const x = i * stepX;
    const y = ((100 - clamped) / 100) * h;
    path += penDown
      ? ` L${x.toFixed(2)},${y.toFixed(2)}`
      : `M${x.toFixed(2)},${y.toFixed(2)}`;
    penDown = true;
  }
  return path;
}

const cpuPath = computed(() => buildPath(props.samples.map((s) => s.cpu)));
const memPath = computed(() => buildPath(props.samples.map((s) => s.mem)));
const gpuPath = computed(() =>
  hasGpu.value ? buildPath(props.samples.map((s) => s.gpu)) : "",
);
</script>

<style scoped>
.host-chart {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px 8px;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 6px;
  background: color-mix(in srgb, var(--surface, #1a1d29) 50%, transparent);
  font-size: 11px;
}
.host-chart__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px;
}
.host-chart__title {
  font-weight: 650;
  color: var(--text, #f5f0e7);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 10px;
}
.host-chart__hint {
  font-size: 10px;
  color: var(--text2, #a8b0c4);
  font-variant-numeric: tabular-nums;
}
.host-chart__svg,
.host-chart__placeholder {
  width: 100%;
  height: 64px;
  display: block;
}
.host-chart__placeholder {
  border: 1px dashed var(--border, #2a2f3e);
  border-radius: 4px;
  opacity: 0.4;
}
.host-chart__guide {
  stroke: var(--border, #2a2f3e);
  stroke-width: 1;
  stroke-dasharray: 2 3;
  opacity: 0.45;
}
.host-chart__line {
  fill: none;
  stroke-width: 1.4;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}
.host-chart__line--cpu {
  stroke: #f5b740;
}
.host-chart__line--mem {
  stroke: #3b5bdb;
}
.host-chart__line--gpu {
  stroke: #2dab66;
}
.host-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 10px;
  color: var(--text2, #a8b0c4);
}
.host-chart__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.host-chart__swatch {
  width: 8px;
  height: 2px;
  display: inline-block;
  border-radius: 1px;
}
.host-chart__swatch--cpu {
  background: #f5b740;
}
.host-chart__swatch--mem {
  background: #3b5bdb;
}
.host-chart__swatch--gpu {
  background: #2dab66;
}
.host-chart__legend-val {
  font-variant-numeric: tabular-nums;
  color: var(--text, #f5f0e7);
}
</style>
