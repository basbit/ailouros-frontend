<template>
  <div class="history-list-page">
    <AppHeaderContainer />
    <main class="history-list-page__body">
      <PaneHeader
        :title="t('history.list.title')"
        :subtitle="t('history.list.subtitle')"
      >
        <template #actions>
          <button
            type="button"
            class="history-list-page__export"
            :disabled="!filteredEntries.length"
            @click="onExportCsv"
          >
            {{ t("history.list.exportCsv") }}
          </button>
          <button
            type="button"
            class="history-list-page__clear"
            :disabled="!ui.historyList.length"
            @click="onClearHistory"
          >
            {{ t("history.list.clear") }}
          </button>
        </template>
      </PaneHeader>

      <div class="history-list-page__toolbar">
        <input
          v-model="searchQuery"
          type="search"
          class="history-list-page__search"
          :placeholder="t('history.list.searchPlaceholder')"
        />
        <select v-model="statusFilter" class="history-list-page__filter">
          <option value="all">{{ t("history.list.filter.all") }}</option>
          <option value="completed">{{ t("history.list.filter.completed") }}</option>
          <option value="failed">{{ t("history.list.filter.failed") }}</option>
          <option value="running">{{ t("history.list.filter.running") }}</option>
        </select>
      </div>

      <p v-if="!filteredEntries.length" class="history-list-page__empty">
        {{
          ui.historyList.length ? t("history.list.noMatches") : t("history.list.empty")
        }}
      </p>

      <div v-else class="history-list-page__table" role="table">
        <div class="history-list-page__head" role="row">
          <span role="columnheader">{{ t("history.list.columns.startedAt") }}</span>
          <span role="columnheader">{{ t("history.list.columns.prompt") }}</span>
          <span role="columnheader">{{ t("history.list.columns.status") }}</span>
          <span role="columnheader">{{ t("history.list.columns.duration") }}</span>
          <span role="columnheader">{{ t("history.list.columns.steps") }}</span>
          <span role="columnheader" />
        </div>
        <div
          v-for="entry in filteredEntries"
          :key="entry.id"
          class="history-list-page__row"
          role="row"
          tabindex="0"
          @click="onOpen(entry.id)"
          @keydown.enter="onOpen(entry.id)"
          @keydown.space.prevent="onOpen(entry.id)"
        >
          <span role="cell" class="history-list-page__cell-time">
            {{ formatStartedAt(entry) }}
          </span>
          <span role="cell" class="history-list-page__cell-prompt">
            {{ promptPreview(entry.prompt) }}
          </span>
          <span role="cell" class="history-list-page__cell-status">
            <span
              class="history-list-page__pill"
              :class="`history-list-page__pill--${statusFamily(entry.status)}`"
            >
              {{ entry.status ?? "—" }}
            </span>
          </span>
          <span role="cell" class="history-list-page__cell-mono">
            {{ formatDuration(entry.durationMs) }}
          </span>
          <span role="cell" class="history-list-page__cell-mono">
            {{ entry.pipeline_steps?.length ?? 0 }}
          </span>
          <span role="cell" class="history-list-page__cell-action">
            <button
              v-if="canResume(entry)"
              type="button"
              class="history-list-page__resume-btn"
              :disabled="resumeBusyId === entry.id"
              :title="t('history.detail.resume.tooltip', { step: '?' })"
              @click.stop="onResumeEntry(entry)"
            >
              {{ t("history.detail.resume.button") }}
            </button>
          </span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeaderContainer from "@/widgets/header/AppHeaderContainer.vue";
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import { useUiStore, type HistoryEntry } from "@/shared/store/ui";
import { formatEuropeanDateTime } from "@/shared/lib/format-date";
import { formatDurationOrDash } from "@/shared/lib/format-relative";
import { useI18n } from "@/shared/lib/i18n";
import { useHistoryListActions } from "./useHistoryListActions";

const ui = useUiStore();
const { t } = useI18n();

const {
  searchQuery,
  statusFilter,
  resumeBusyId,
  filteredEntries,
  statusFamily,
  canResume,
  onResumeEntry,
  onClearHistory,
  onOpen,
  onExportCsv,
} = useHistoryListActions();

function promptPreview(prompt: string): string {
  const first = (prompt ?? "").split("\n")[0];
  return first.length > 120 ? `${first.slice(0, 119)}…` : first;
}

function formatStartedAt(entry: HistoryEntry): string {
  return formatEuropeanDateTime(entry.startedAt ?? entry.at) || "—";
}

const formatDuration = formatDurationOrDash;
</script>

<style scoped>
.history-list-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  padding-top: var(--hdr-h);
  background: var(--bg);
}

.history-list-page__body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 24px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-list-page__export {
  appearance: none;
  padding: 6px 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.history-list-page__export:hover:not(:disabled) {
  border-color: var(--line-strong);
}

.history-list-page__export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.history-list-page__clear {
  appearance: none;
  margin-left: 8px;
  padding: 6px 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.history-list-page__clear:hover:not(:disabled) {
  border-color: var(--danger, #e03131);
  color: var(--danger, #e03131);
}

.history-list-page__clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.history-list-page__toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.history-list-page__search {
  flex: 1 1 300px;
  max-width: 360px;
  padding: 8px 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-size: 13px;
}

.history-list-page__search:focus,
.history-list-page__filter:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.history-list-page__filter {
  appearance: none;
  padding: 8px 28px 8px 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-size: 13px;
  cursor: pointer;
}

.history-list-page__empty {
  margin: 32px 0 0;
  text-align: center;
  color: var(--ink-4);
  font-size: 13px;
}

.history-list-page__table {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-list-page__head,
.history-list-page__row {
  display: grid;
  grid-template-columns: 160px 1fr 140px 110px 80px 180px;
  align-items: center;
  gap: 16px;
  padding: 10px 14px;
}

.history-list-page__head {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-4);
  border-bottom: 1px solid var(--line);
}

.history-list-page__row {
  appearance: none;
  width: 100%;
  text-align: left;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  cursor: pointer;
  color: var(--ink);
  transition:
    border-color 0.14s,
    transform 0.14s;
}

.history-list-page__row:hover {
  border-color: var(--accent);
  transform: translateX(2px);
}

.history-list-page__cell-time,
.history-list-page__cell-mono {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-2);
}

.history-list-page__cell-prompt {
  font-size: 13px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-list-page__cell-status {
  font-size: 12px;
}

.history-list-page__pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.history-list-page__pill--ok {
  background: var(--ok-soft);
  color: var(--ok);
}

.history-list-page__pill--fail {
  background: color-mix(in srgb, var(--error) 16%, transparent);
  color: var(--error);
}

.history-list-page__pill--warn {
  background: rgba(201, 138, 26, 0.16);
  color: var(--warn);
}

.history-list-page__pill--run {
  background: var(--accent-soft);
  color: var(--accent-2);
}

.history-list-page__pill--pending {
  background: var(--card-soft);
  color: var(--ink-3);
}

.history-list-page__cell-action {
  display: flex;
  justify-content: flex-end;
}

.history-list-page__resume-btn {
  appearance: none;
  padding: 6px 14px;
  border-radius: var(--r-sm);
  border: 1px solid var(--warn, #c98a1a);
  background: var(--warn-soft, rgba(201, 138, 26, 0.08));
  color: var(--warn, #c98a1a);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.history-list-page__resume-btn:hover:not(:disabled) {
  background: var(--warn, #c98a1a);
  color: var(--card, #fff);
}

.history-list-page__resume-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
