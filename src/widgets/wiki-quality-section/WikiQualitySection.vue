<template>
  <details class="wiki-quality" @toggle="onToggle">
    <summary class="wiki-quality__head">{{ t("wikiQuality.title") }}</summary>
    <div class="wiki-quality__body">
      <div class="wiki-quality__actions">
        <button
          type="button"
          class="wiki-quality__run"
          :disabled="loading || !workspaceRoot.trim()"
          @click="onRun"
        >
          {{ loading ? t("wikiQuality.running") : t("wikiQuality.run") }}
        </button>
        <button
          v-if="report"
          type="button"
          class="wiki-quality__clear"
          @click="onClear"
        >
          {{ t("wikiQuality.clear") }}
        </button>
      </div>
      <p v-if="!workspaceRoot.trim()" class="wiki-quality__hint">
        {{ t("wikiQuality.noWorkspace") }}
      </p>
      <p v-else-if="error" class="wiki-quality__error">{{ error }}</p>
      <template v-else-if="report">
        <p class="wiki-quality__summary">
          {{
            t("wikiQuality.summary", {
              articles: report.summary.article_count,
              chunks: report.summary.chunk_count,
              error: report.summary.findings_by_severity.error ?? 0,
              warning: report.summary.findings_by_severity.warning ?? 0,
              info: report.summary.findings_by_severity.info ?? 0,
            })
          }}
        </p>
        <p v-if="!report.findings.length" class="wiki-quality__hint">
          {{ t("wikiQuality.clean") }}
        </p>
        <ul v-else class="wiki-quality__list">
          <li
            v-for="(finding, index) in report.findings"
            :key="`${finding.article_path}-${finding.rule}-${index}`"
            class="wiki-quality__item"
            :data-severity="finding.severity"
          >
            <div class="wiki-quality__row">
              <span class="wiki-quality__severity">{{ finding.severity }}</span>
              <span class="wiki-quality__rule">{{ finding.rule }}</span>
              <span class="wiki-quality__path">{{ finding.article_path }}</span>
            </div>
            <div class="wiki-quality__msg">{{ finding.message }}</div>
            <div v-if="finding.suggestion" class="wiki-quality__fix">
              {{ finding.suggestion }}
            </div>
          </li>
        </ul>
      </template>
    </div>
  </details>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";
import { useWikiQualityAudit } from "@/features/wiki-quality-audit/useWikiQualityAudit";

const props = defineProps<{ workspaceRoot: string }>();

const { t } = useI18n();
const { report, loading, error, run, clear } = useWikiQualityAudit();

function onToggle(event: Event): void {
  const target = event.target as HTMLDetailsElement;
  if (target.open && !report.value && !loading.value && props.workspaceRoot.trim()) {
    void run(props.workspaceRoot);
  }
}

async function onRun(): Promise<void> {
  await run(props.workspaceRoot);
}

function onClear(): void {
  clear();
}
</script>

<style scoped>
.wiki-quality {
  margin: 8px 0;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 8px;
  background: var(--surface2, #14171f);
}
.wiki-quality__head {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: var(--text, #f5f0e7);
}
.wiki-quality__body {
  padding: 8px 10px 10px;
  border-top: 1px solid var(--border, #2a2f3e);
}
.wiki-quality__actions {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.wiki-quality__run,
.wiki-quality__clear {
  border: 1px solid var(--border, #2a2f3e);
  background: var(--surface, #11141a);
  color: var(--text, #f5f0e7);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
}
.wiki-quality__run:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.wiki-quality__hint,
.wiki-quality__summary {
  font-size: 11px;
  color: var(--text2, #a8b0c4);
  margin: 4px 0;
}
.wiki-quality__error {
  color: var(--error, #d7563f);
  font-size: 11px;
  margin: 4px 0;
}
.wiki-quality__list {
  list-style: none;
  padding: 0;
  margin: 6px 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
}
.wiki-quality__item {
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 6px;
  padding: 6px 8px;
  background: var(--surface, #11141a);
}
.wiki-quality__item[data-severity="error"] {
  border-color: color-mix(in srgb, var(--error, #d7563f) 60%, transparent);
}
.wiki-quality__item[data-severity="warning"] {
  border-color: color-mix(in srgb, #d99f24 55%, transparent);
}
.wiki-quality__row {
  display: flex;
  gap: 6px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text2, #a8b0c4);
  margin-bottom: 4px;
  flex-wrap: wrap;
}
.wiki-quality__severity {
  font-weight: 600;
  color: var(--text, #f5f0e7);
}
.wiki-quality__rule {
  color: var(--accent, #3b5bdb);
}
.wiki-quality__path {
  margin-left: auto;
  font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
}
.wiki-quality__msg {
  font-size: 12px;
  color: var(--text, #f5f0e7);
}
.wiki-quality__fix {
  font-size: 11px;
  color: var(--text2, #a8b0c4);
  margin-top: 2px;
}
</style>
