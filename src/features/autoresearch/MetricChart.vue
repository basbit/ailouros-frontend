<template>
  <figure class="metric-chart">
    <figcaption class="metric-chart__title">
      {{ t("autoresearch.view.chartTitle") }}
    </figcaption>
    <p v-if="!chart" class="metric-chart__empty">
      {{ t("autoresearch.view.chartEmpty") }}
    </p>
    <template v-else>
      <svg
        class="metric-chart__svg"
        :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
        preserveAspectRatio="none"
        role="img"
        :aria-label="t('autoresearch.view.chartTitle')"
      >
        <polyline class="metric-chart__best" :points="chart.bestLine" />
        <circle
          v-for="point in chart.points"
          :key="point.iteration"
          :class="['metric-chart__point', `metric-chart__point--${point.decision}`]"
          :cx="point.x"
          :cy="point.y"
          r="3"
        >
          <title>#{{ point.iteration }}: {{ formatMetricValue(point.value) }}</title>
        </circle>
      </svg>
      <div class="metric-chart__range">
        <span>{{ formatMetricValue(chart.minValue) }}</span>
        <span>{{ formatMetricValue(chart.maxValue) }}</span>
      </div>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type { ResearchSession } from "@/shared/api/endpoints/autoresearch";
import { buildMetricChart } from "./model/chart";
import { formatMetricValue } from "./model/format";

const props = defineProps<{ session: ResearchSession }>();
const { t } = useI18n();

const WIDTH = 480;
const HEIGHT = 140;

const chart = computed(() => buildMetricChart(props.session, WIDTH, HEIGHT));
</script>

<style scoped>
.metric-chart {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-chart__title {
  font-size: 12px;
  color: var(--muted);
}

.metric-chart__empty {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.metric-chart__svg {
  width: 100%;
  height: 140px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.metric-chart__best {
  fill: none;
  stroke: var(--accent-primary);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.metric-chart__point--baseline {
  fill: var(--text);
}

.metric-chart__point--kept {
  fill: var(--success);
}

.metric-chart__point--reverted {
  fill: var(--muted);
}

.metric-chart__range {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--muted);
  font-family: var(--mono);
}
</style>
