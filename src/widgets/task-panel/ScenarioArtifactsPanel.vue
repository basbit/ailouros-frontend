<template>
  <section v-if="visible" class="scenario-artifacts">
    <header class="scenario-artifacts__head">
      <span class="scenario-artifacts__title">{{ t("scenarioArtifacts.title") }}</span>
      <span v-if="data" class="scenario-artifacts__summary">
        {{
          t("scenarioArtifacts.summary", {
            present: data.summary.present,
            total: data.summary.total,
          })
        }}
      </span>
    </header>

    <div v-if="loading" class="scenario-artifacts__status">
      {{ t("scenarioArtifacts.loading") }}
    </div>
    <div v-else-if="error" class="scenario-artifacts__error">
      {{ t("scenarioArtifacts.error", { error }) }}
    </div>
    <ul v-else-if="data && data.status.length" class="scenario-artifacts__list">
      <li
        v-for="entry in data.status"
        :key="entry.path"
        class="scenario-artifacts__item"
        :class="{
          'scenario-artifacts__item--present': entry.present,
          'scenario-artifacts__item--missing': !entry.present,
        }"
      >
        <span class="scenario-artifacts__badge">
          {{
            entry.present
              ? t("scenarioArtifacts.present")
              : t("scenarioArtifacts.missing")
          }}
        </span>
        <a
          v-if="entry.present && entry.url"
          :href="resolveLink(entry.url)"
          class="scenario-artifacts__path"
          target="_blank"
          rel="noreferrer"
        >
          {{ entry.path }}
        </a>
        <span v-else class="scenario-artifacts__path">{{ entry.path }}</span>
        <span
          v-if="entry.present && entry.size !== null"
          class="scenario-artifacts__size"
        >
          {{ formatSize(entry.size) }}
        </span>
      </li>
    </ul>
    <div v-else class="scenario-artifacts__empty">
      {{ t("scenarioArtifacts.empty") }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { toRef } from "vue";
import { apiUrl } from "@/shared/api/base";
import { useI18n } from "@/shared/lib/i18n";
import { getScenarioArtifacts } from "@/shared/api/endpoints/scenarios";
import type { ScenarioArtifactsResponse } from "@/shared/model/scenario-types";
import { useScenarioFinishedReload } from "./useScenarioFinishedReload";

const props = defineProps<{
  taskId: string | null;
  scenarioId: string | null;
  taskStatus: string | null;
}>();

const { t } = useI18n();

const { data, loading, error, visible } =
  useScenarioFinishedReload<ScenarioArtifactsResponse>({
    taskId: toRef(props, "taskId"),
    scenarioId: toRef(props, "scenarioId"),
    taskStatus: toRef(props, "taskStatus"),
    fetcher: getScenarioArtifacts,
  });

function resolveLink(url: string): string {
  return url.startsWith("http") ? url : apiUrl(url);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>

<style scoped>
.scenario-artifacts {
  border-top: 1px solid var(--border);
  margin-top: 12px;
  padding-top: 12px;
}
.scenario-artifacts__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.scenario-artifacts__title {
  font-size: 12px;
  font-weight: 650;
  color: var(--text, #f5f0e7);
}
.scenario-artifacts__summary {
  font-size: 11px;
  color: var(--text2, #a8b0c4);
}
.scenario-artifacts__status,
.scenario-artifacts__empty {
  font-size: 12px;
  color: var(--text2, #a8b0c4);
  padding: 6px 0;
}
.scenario-artifacts__error {
  font-size: 12px;
  color: var(--error, #d7563f);
  padding: 6px 0;
}
.scenario-artifacts__list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.scenario-artifacts__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--surface, #1a1d29) 60%, transparent);
  font-size: 11px;
}
.scenario-artifacts__item--missing {
  background: color-mix(in srgb, var(--error, #d7563f) 12%, transparent);
}
.scenario-artifacts__badge {
  flex-shrink: 0;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.scenario-artifacts__item--present .scenario-artifacts__badge {
  background: color-mix(in srgb, var(--success, #2dab66) 30%, transparent);
  color: var(--text, #f5f0e7);
}
.scenario-artifacts__item--missing .scenario-artifacts__badge {
  background: color-mix(in srgb, var(--error, #d7563f) 35%, transparent);
  color: var(--text, #f5f0e7);
}
.scenario-artifacts__path {
  flex: 1;
  font-family: var(--font-mono, ui-monospace, "SFMono-Regular", monospace);
  font-size: 11px;
  color: var(--text, #f5f0e7);
  text-decoration: none;
  overflow-wrap: anywhere;
}
.scenario-artifacts__path:hover {
  text-decoration: underline;
}
.scenario-artifacts__size {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--text2, #a8b0c4);
}
</style>
