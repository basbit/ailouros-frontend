<template>
  <figure class="day-chart">
    <figcaption class="day-chart__title">{{ t("effect.chart.title") }}</figcaption>
    <p v-if="!chart || chart.maxTotal === 0" class="day-chart__empty">
      {{ t("effect.chart.empty") }}
    </p>
    <template v-else>
      <svg
        class="day-chart__svg"
        :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
        preserveAspectRatio="none"
        role="img"
        :aria-label="t('effect.chart.title')"
      >
        <g v-for="bar in chart.bars" :key="bar.day">
          <title>
            {{ t("effect.chart.barTitle", { day: bar.day, total: bar.total }) }}
          </title>
          <rect
            class="day-chart__completed"
            :x="bar.x"
            :width="bar.width"
            :y="HEIGHT - bar.completedHeight"
            :height="bar.completedHeight"
          />
          <rect
            class="day-chart__failed"
            :x="bar.x"
            :width="bar.width"
            :y="HEIGHT - bar.completedHeight - bar.failedHeight"
            :height="bar.failedHeight"
          />
          <rect
            class="day-chart__other"
            :x="bar.x"
            :width="bar.width"
            :y="HEIGHT - bar.completedHeight - bar.failedHeight - bar.otherHeight"
            :height="bar.otherHeight"
          />
        </g>
      </svg>
      <div class="day-chart__axis">
        <span>{{ chart.bars[0].day }}</span>
        <span>{{ t("effect.chart.max", { count: chart.maxTotal }) }}</span>
        <span>{{ chart.bars[chart.bars.length - 1].day }}</span>
      </div>
      <ul class="day-chart__legend">
        <li class="day-chart__legend-item day-chart__legend-item--completed">
          {{ t("effect.chart.completed") }}
        </li>
        <li class="day-chart__legend-item day-chart__legend-item--failed">
          {{ t("effect.chart.failed") }}
        </li>
        <li class="day-chart__legend-item day-chart__legend-item--other">
          {{ t("effect.chart.other") }}
        </li>
      </ul>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type { DayRunCount } from "@/shared/api/endpoints/effect-metrics";
import { buildDayChart } from "./model/day-chart";

const props = defineProps<{ days: DayRunCount[] }>();
const { t } = useI18n();

const WIDTH = 600;
const HEIGHT = 140;

const chart = computed(() => buildDayChart(props.days, WIDTH, HEIGHT));
</script>

<style scoped>
.day-chart {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.day-chart__title {
  font-size: 13px;
  color: var(--text);
}

.day-chart__empty {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.day-chart__svg {
  width: 100%;
  height: 140px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.day-chart__completed {
  fill: var(--success);
}

.day-chart__failed {
  fill: var(--danger);
}

.day-chart__other {
  fill: var(--muted);
}

.day-chart__axis {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--muted);
  font-family: var(--mono);
}

.day-chart__legend {
  display: flex;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 11px;
  color: var(--muted);
}

.day-chart__legend-item::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 4px;
  border-radius: 2px;
}

.day-chart__legend-item--completed::before {
  background: var(--success);
}

.day-chart__legend-item--failed::before {
  background: var(--danger);
}

.day-chart__legend-item--other::before {
  background: var(--muted);
}
</style>
