<template>
  <section class="cross-stats">
    <header class="cross-stats__head">
      <span class="cross-stats__title">{{ t("observability.title") }}</span>
      <button
        type="button"
        class="cross-stats__reload"
        :disabled="loading"
        @click="reload"
      >
        ↻
      </button>
    </header>
    <div v-if="loading" class="cross-stats__status">…</div>
    <div v-else-if="error" class="cross-stats__error">{{ error }}</div>
    <div v-else-if="!data || data.aggregate.total === 0" class="cross-stats__empty">
      {{ t("observability.empty") }}
    </div>
    <div v-else class="cross-stats__body">
      <div class="cross-stats__row">
        <span class="cross-stats__label">{{ t("observability.totalRuns") }}</span>
        <span class="cross-stats__value">{{ data.aggregate.total }}</span>
      </div>
      <div class="cross-stats__row">
        <span class="cross-stats__label">{{ t("observability.byStatus") }}</span>
        <div class="cross-stats__chips">
          <span
            v-for="(count, status) in data.aggregate.by_status"
            :key="status"
            class="cross-stats__chip"
            >{{ status }}: {{ count }}</span
          >
        </div>
      </div>
      <div class="cross-stats__row">
        <span class="cross-stats__label">{{ t("observability.byScenario") }}</span>
        <div class="cross-stats__chips">
          <span
            v-for="(count, scenario) in data.aggregate.by_scenario"
            :key="scenario"
            class="cross-stats__chip"
            >{{ scenario }}: {{ count }}</span
          >
        </div>
      </div>
      <div v-if="data.aggregate.avg_overall_score !== null" class="cross-stats__row">
        <span class="cross-stats__label">avg score</span>
        <span class="cross-stats__value">
          {{ data.aggregate.avg_overall_score.toFixed(2) }}
        </span>
      </div>
      <div v-if="data.aggregate.series" class="cross-stats__charts">
        <div class="cross-stats__chart">
          <span class="cross-stats__chart-label">
            {{ t("observability.runsTrend") }}
          </span>
          <Sparkline
            mode="bar"
            :values="data.aggregate.series.runs"
            :aria-label="t('observability.runsTrend')"
          />
          <span class="cross-stats__chart-range">
            {{ rangeLabel }}
          </span>
        </div>
        <div v-if="hasScoreSeries" class="cross-stats__chart">
          <span class="cross-stats__chart-label">
            {{ t("observability.scoreTrend") }}
          </span>
          <Sparkline
            mode="line"
            :values="data.aggregate.series.avg_score"
            :aria-label="t('observability.scoreTrend')"
          />
          <span class="cross-stats__chart-range">{{ rangeLabel }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import {
  getCrossProjectObservability,
  type ObservabilityResponse,
} from "@/shared/api/endpoints/observability";
import Sparkline from "./Sparkline.vue";

const { t } = useI18n();
const loading = ref(false);
const error = ref<string | null>(null);
const data = ref<ObservabilityResponse | null>(null);

const rangeLabel = computed(() => {
  const series = data.value?.aggregate.series;
  if (!series || !series.days.length) return "";
  return `${series.days[0]} → ${series.days[series.days.length - 1]}`;
});

const hasScoreSeries = computed(() => {
  const scores = data.value?.aggregate.series?.avg_score ?? [];
  return scores.some((value) => typeof value === "number" && Number.isFinite(value));
});

async function reload(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    data.value = await getCrossProjectObservability();
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
    data.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void reload();
});
</script>

<style scoped>
.cross-stats {
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 10px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--surface, #1a1d29) 60%, transparent);
}
.cross-stats__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.cross-stats__title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text2, #a8b0c4);
}
.cross-stats__reload {
  background: transparent;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text, #f5f0e7);
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
}
.cross-stats__status,
.cross-stats__empty {
  font-size: 12px;
  color: var(--text2, #a8b0c4);
}
.cross-stats__error {
  font-size: 12px;
  color: var(--error, #d7563f);
}
.cross-stats__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cross-stats__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 11px;
}
.cross-stats__label {
  font-weight: 600;
  color: var(--text2, #a8b0c4);
  min-width: 100px;
}
.cross-stats__value {
  font-weight: 600;
}
.cross-stats__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.cross-stats__chip {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text3, #6b7280) 25%, transparent);
}
.cross-stats__charts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
}
.cross-stats__chart {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cross-stats__chart-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text2, #a8b0c4);
}
.cross-stats__chart-range {
  font-size: 9px;
  color: var(--text3, #6b7280);
  font-family: var(--mono, ui-monospace, monospace);
}
</style>
