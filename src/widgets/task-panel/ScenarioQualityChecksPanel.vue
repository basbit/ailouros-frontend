<template>
  <section v-if="visible" class="quality-checks">
    <header class="quality-checks__head">
      <span class="quality-checks__title">{{ t("qualityChecks.title") }}</span>
      <span v-if="data" class="quality-checks__summary">
        {{
          t("qualityChecks.summary", {
            passed: data.summary.passed,
            total: data.summary.total,
          })
        }}
      </span>
    </header>

    <div v-if="loading" class="quality-checks__status">
      {{ t("qualityChecks.loading") }}
    </div>
    <div v-else-if="error" class="quality-checks__error">
      {{ t("qualityChecks.error", { error }) }}
    </div>
    <ul v-else-if="data && data.results.length" class="quality-checks__list">
      <li
        v-for="entry in data.results"
        :key="entry.id"
        class="quality-checks__item"
        :class="{
          'quality-checks__item--pass': entry.passed,
          'quality-checks__item--fail': !entry.passed,
          'quality-checks__item--blocking': !entry.passed && entry.blocking,
        }"
      >
        <span class="quality-checks__badge">
          {{ entry.passed ? t("qualityChecks.passed") : t("qualityChecks.failed") }}
        </span>
        <div class="quality-checks__body">
          <div class="quality-checks__row">
            <span class="quality-checks__id">{{ entry.id }}</span>
            <span
              class="quality-checks__severity"
              :class="`quality-checks__severity--${entry.severity}`"
            >
              {{ t(`qualityChecks.severity.${entry.severity}`) }}
            </span>
            <span v-if="entry.blocking" class="quality-checks__blocking">
              {{ t("qualityChecks.blocking") }}
            </span>
          </div>
          <div class="quality-checks__message">{{ entry.message }}</div>
        </div>
      </li>
    </ul>
    <div v-else class="quality-checks__empty">
      {{ t("qualityChecks.empty") }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { toRef } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { getScenarioQualityChecks } from "@/shared/api/endpoints/scenarios";
import type { ScenarioQualityChecksResponse } from "@/shared/model/scenario-types";
import { useScenarioFinishedReload } from "./useScenarioFinishedReload";

const props = defineProps<{
  taskId: string | null;
  scenarioId: string | null;
  taskStatus: string | null;
}>();

const { t } = useI18n();

const { data, loading, error, visible } =
  useScenarioFinishedReload<ScenarioQualityChecksResponse>({
    taskId: toRef(props, "taskId"),
    scenarioId: toRef(props, "scenarioId"),
    taskStatus: toRef(props, "taskStatus"),
    fetcher: getScenarioQualityChecks,
  });
</script>

<style scoped>
.quality-checks {
  border-top: 1px solid var(--border);
  margin-top: 12px;
  padding-top: 12px;
}
.quality-checks__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.quality-checks__title {
  font-size: 12px;
  font-weight: 650;
  color: var(--text, #f5f0e7);
}
.quality-checks__summary {
  font-size: 11px;
  color: var(--text2, #a8b0c4);
}
.quality-checks__status,
.quality-checks__empty {
  font-size: 12px;
  color: var(--text2, #a8b0c4);
  padding: 6px 0;
}
.quality-checks__error {
  font-size: 12px;
  color: var(--error, #d7563f);
  padding: 6px 0;
}
.quality-checks__list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.quality-checks__item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--surface, #1a1d29) 60%, transparent);
}
.quality-checks__item--fail {
  background: color-mix(in srgb, var(--error, #d7563f) 12%, transparent);
}
.quality-checks__item--blocking {
  outline: 1px solid color-mix(in srgb, var(--error, #d7563f) 60%, transparent);
}
.quality-checks__badge {
  flex-shrink: 0;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.quality-checks__item--pass .quality-checks__badge {
  background: color-mix(in srgb, var(--success, #2dab66) 30%, transparent);
  color: var(--text, #f5f0e7);
}
.quality-checks__item--fail .quality-checks__badge {
  background: color-mix(in srgb, var(--error, #d7563f) 35%, transparent);
  color: var(--text, #f5f0e7);
}
.quality-checks__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.quality-checks__row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.quality-checks__id {
  font-family: var(--font-mono, ui-monospace, "SFMono-Regular", monospace);
  font-size: 11px;
  color: var(--text, #f5f0e7);
}
.quality-checks__severity {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
}
.quality-checks__severity--error {
  background: color-mix(in srgb, var(--error, #d7563f) 30%, transparent);
  color: var(--text, #f5f0e7);
}
.quality-checks__severity--warning {
  background: color-mix(in srgb, #d99f24 30%, transparent);
  color: var(--text, #f5f0e7);
}
.quality-checks__severity--info {
  background: color-mix(in srgb, #4b9fea 25%, transparent);
  color: var(--text, #f5f0e7);
}
.quality-checks__blocking {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--error, #d7563f);
  color: #fff;
  text-transform: uppercase;
}
.quality-checks__message {
  font-size: 11px;
  color: var(--text2, #a8b0c4);
}
</style>
