<template>
  <div class="floor-metrics" :aria-label="t('hostMetrics.ariaLabel')">
    <div id="floorMetricsInner">
      <div v-if="!metrics" class="floor-metrics-wait">
        <span class="floor-metrics-dot"></span>
        {{ t("hostMetrics.awaiting") }}
      </div>
      <div v-else-if="metrics.error" class="floor-metrics-err">
        {{ t("hostMetrics.metricsPrefix") }}: {{ metrics.error }}
      </div>
      <div
        v-else-if="typeof metrics.cpu_percent === 'number'"
        class="floor-metrics-grid"
      >
        <div class="floor-metric">
          <div class="floor-metric-top">
            <span class="floor-metric-name">{{ t("hostMetrics.cpu") }}</span>
            <span class="floor-metric-val">{{ cpu }}%</span>
          </div>
          <div class="floor-bar">
            <div
              class="floor-bar-fill floor-bar-fill--cpu"
              :style="{ width: cpuPct + '%' }"
            ></div>
          </div>
        </div>
        <div class="floor-metric">
          <div class="floor-metric-top">
            <span class="floor-metric-name">{{ t("hostMetrics.memory") }}</span>
            <span class="floor-metric-val">
              {{ memPct != null ? memPct + "%" : "—" }}
              <template v-if="memGb != null"> · {{ memGb }} GB</template>
            </span>
          </div>
          <div class="floor-bar">
            <div
              class="floor-bar-fill floor-bar-fill--mem"
              :style="{ width: memPctClamped + '%' }"
            ></div>
          </div>
        </div>
        <div
          v-if="loadavg"
          class="floor-metric floor-metric--load floor-metric--load-only"
        >
          <span class="floor-metric-name">{{ t("hostMetrics.loadAverage") }}</span>
          <span class="floor-metric-val floor-metric-val--mono">{{ loadavg }}</span>
        </div>
      </div>
      <div v-else-if="metrics.loadavg" class="floor-metrics-grid">
        <div class="floor-metric floor-metric--load floor-metric--load-only">
          <span class="floor-metric-name">{{ t("hostMetrics.loadAverage") }}</span>
          <span class="floor-metric-val floor-metric-val--mono">{{ loadavgStr }}</span>
        </div>
      </div>
      <div v-else class="floor-metrics-wait">
        <span class="floor-metrics-dot"></span>
        {{ t("hostMetrics.awaiting") }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { HostMetrics } from "@/shared/store/ui";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{ metrics: HostMetrics | null }>();
const { t } = useI18n();

const cpu = computed(() =>
  typeof props.metrics?.cpu_percent === "number"
    ? Math.round(props.metrics.cpu_percent * 10) / 10
    : 0,
);
const cpuPct = computed(() => Math.min(100, Math.max(0, cpu.value)));
const memPct = computed(() =>
  typeof props.metrics?.memory_percent === "number"
    ? Math.round(props.metrics.memory_percent * 10) / 10
    : null,
);
const memGb = computed(() =>
  typeof props.metrics?.memory_used_gb === "number"
    ? props.metrics.memory_used_gb
    : null,
);
const memPctClamped = computed(() =>
  memPct.value != null ? Math.min(100, Math.max(0, memPct.value)) : 0,
);
const loadavg = computed(() => {
  const la = props.metrics?.loadavg;
  if (!la) return null;
  return Array.isArray(la) ? la.join(", ") : JSON.stringify(la);
});
const loadavgStr = computed(() => loadavg.value ?? "");
</script>
