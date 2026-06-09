<template>
  <details class="trace-inspector" @toggle="onToggle">
    <summary class="trace-inspector__head">{{ t("traceInspector.title") }}</summary>
    <div class="trace-inspector__body">
      <div class="trace-inspector__actions">
        <button
          type="button"
          class="trace-inspector__reload"
          :disabled="loading || !workspaceRoot.trim()"
          @click="onReload"
        >
          {{ loading ? t("traceInspector.loading") : t("traceInspector.reload") }}
        </button>
      </div>
      <p v-if="!workspaceRoot.trim()" class="trace-inspector__hint">
        {{ t("traceInspector.noWorkspace") }}
      </p>
      <p v-else-if="error" class="trace-inspector__error">{{ error }}</p>
      <p v-else-if="!summaries.length" class="trace-inspector__hint">
        {{ t("traceInspector.empty") }}
      </p>
      <ul v-else class="trace-inspector__list">
        <li
          v-for="summary in summaries"
          :key="summary.trace_id"
          class="trace-inspector__item"
          :data-verdict="summary.final_verdict"
        >
          <button
            type="button"
            class="trace-inspector__open"
            :disabled="loading"
            @click="onOpen(summary.trace_id)"
          >
            <div class="trace-inspector__row">
              <span class="trace-inspector__verdict">
                {{ summary.final_verdict || "—" }}
              </span>
              <span class="trace-inspector__backend">{{ summary.backend }}</span>
              <span class="trace-inspector__latency">
                {{ summary.total_duration_ms.toFixed(1) }} ms
              </span>
            </div>
            <div class="trace-inspector__query">{{ summary.query }}</div>
          </button>
        </li>
      </ul>

      <div v-if="selected" class="trace-inspector__detail">
        <header class="trace-inspector__detail-head">
          <span class="trace-inspector__detail-title">
            {{ t("traceInspector.traceTitle") }}
          </span>
          <button type="button" class="trace-inspector__close" @click="closeSelected">
            ×
          </button>
        </header>
        <p class="trace-inspector__detail-query">{{ selected.query }}</p>
        <ul class="trace-inspector__stages">
          <li
            v-for="(stage, index) in selected.stages"
            :key="`${stage.name}-${index}`"
            class="trace-inspector__stage"
          >
            <div class="trace-inspector__row">
              <span class="trace-inspector__stage-name">{{ stage.name }}</span>
              <span class="trace-inspector__stage-latency">
                {{ stage.duration_ms.toFixed(1) }} ms
              </span>
            </div>
            <pre v-if="hasDetails(stage.details)" class="trace-inspector__details">{{
              formatDetails(stage.details)
            }}</pre>
          </li>
        </ul>
        <div class="trace-inspector__candidates">
          <span>{{ t("traceInspector.candidates") }}</span>
          <code
            v-for="cid in selected.final_candidate_ids"
            :key="cid"
            class="trace-inspector__chunk-id"
          >
            {{ cid }}
          </code>
        </div>
        <div class="trace-inspector__detail-actions">
          <button type="button" class="trace-inspector__copy" @click="onCopyGolden">
            {{ copyStatus || t("traceInspector.copyGolden") }}
          </button>
        </div>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useRetrievalTraceInspector } from "@/features/retrieval-trace-inspector/useRetrievalTraceInspector";

const props = defineProps<{ workspaceRoot: string }>();

const { t } = useI18n();
const {
  summaries,
  selected,
  loading,
  error,
  reload,
  open,
  closeSelected,
  asGoldenJsonl,
} = useRetrievalTraceInspector();
const copyStatus = ref("");

async function onReload(): Promise<void> {
  await reload(props.workspaceRoot);
}

async function onOpen(traceId: string): Promise<void> {
  await open(props.workspaceRoot, traceId);
}

function onToggle(event: Event): void {
  const target = event.target as HTMLDetailsElement;
  if (
    target.open &&
    !summaries.value.length &&
    !loading.value &&
    props.workspaceRoot.trim()
  ) {
    void reload(props.workspaceRoot);
  }
}

function hasDetails(value: Record<string, unknown>): boolean {
  return value && Object.keys(value).length > 0;
}

function formatDetails(value: Record<string, unknown>): string {
  return JSON.stringify(value, null, 2);
}

async function onCopyGolden(): Promise<void> {
  const text = asGoldenJsonl(selected.value);
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copyStatus.value = t("traceInspector.copied");
  } catch (caught) {
    copyStatus.value = caught instanceof Error ? caught.message : String(caught);
  }
  setTimeout(() => {
    copyStatus.value = "";
  }, 2000);
}
</script>

<style scoped>
.trace-inspector {
  margin: 8px 0;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 8px;
  background: var(--surface2, #14171f);
}
.trace-inspector__head {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: var(--text, #f5f0e7);
}
.trace-inspector__body {
  padding: 8px 10px 10px;
  border-top: 1px solid var(--border, #2a2f3e);
}
.trace-inspector__actions {
  margin-bottom: 8px;
}
.trace-inspector__reload,
.trace-inspector__close,
.trace-inspector__copy {
  border: 1px solid var(--border, #2a2f3e);
  background: var(--surface, #11141a);
  color: var(--text, #f5f0e7);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
}
.trace-inspector__reload:disabled,
.trace-inspector__open:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.trace-inspector__hint,
.trace-inspector__error {
  font-size: 11px;
  color: var(--text2, #a8b0c4);
  margin: 4px 0;
}
.trace-inspector__error {
  color: var(--error, #d7563f);
}
.trace-inspector__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
}
.trace-inspector__item {
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 6px;
  background: var(--surface, #11141a);
}
.trace-inspector__item[data-verdict="weak"] {
  border-color: color-mix(in srgb, #d99f24 55%, transparent);
}
.trace-inspector__item[data-verdict="empty"] {
  border-color: color-mix(in srgb, var(--error, #d7563f) 55%, transparent);
}
.trace-inspector__open {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  color: inherit;
  padding: 6px 8px;
  cursor: pointer;
  font: inherit;
}
.trace-inspector__row {
  display: flex;
  gap: 8px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text2, #a8b0c4);
}
.trace-inspector__verdict {
  font-weight: 600;
  color: var(--text, #f5f0e7);
}
.trace-inspector__latency,
.trace-inspector__stage-latency {
  margin-left: auto;
  font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
}
.trace-inspector__query,
.trace-inspector__detail-query {
  font-size: 12px;
  margin-top: 4px;
  color: var(--text, #f5f0e7);
  white-space: pre-wrap;
}
.trace-inspector__detail {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border, #2a2f3e);
}
.trace-inspector__detail-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.trace-inspector__detail-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text2, #a8b0c4);
  flex: 1;
}
.trace-inspector__stages {
  list-style: none;
  padding: 0;
  margin: 6px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.trace-inspector__stage {
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 6px;
  padding: 4px 6px;
  background: var(--surface, #11141a);
}
.trace-inspector__stage-name {
  font-weight: 600;
  color: var(--accent, #3b5bdb);
}
.trace-inspector__details {
  margin: 4px 0 0;
  padding: 4px 6px;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow-x: auto;
  font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
}
.trace-inspector__candidates {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 11px;
  color: var(--text2, #a8b0c4);
  align-items: center;
}
.trace-inspector__chunk-id {
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}
.trace-inspector__detail-actions {
  margin-top: 8px;
}
</style>
