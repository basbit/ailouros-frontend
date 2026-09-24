<template>
  <div class="history-list-table" role="table">
    <div class="history-list-table__head" role="row">
      <span role="columnheader">{{ t("history.list.columns.startedAt") }}</span>
      <span role="columnheader">{{ t("history.list.columns.prompt") }}</span>
      <span role="columnheader">{{ t("history.list.columns.status") }}</span>
      <span role="columnheader">{{ t("history.list.columns.duration") }}</span>
      <span role="columnheader">{{ t("history.list.columns.steps") }}</span>
      <span role="columnheader" />
    </div>
    <div
      v-for="entry in entries"
      :key="entry.id"
      class="history-list-table__row"
      role="row"
      tabindex="0"
      @click="emit('open', entry.id)"
      @keydown.enter="emit('open', entry.id)"
      @keydown.space.prevent="emit('open', entry.id)"
    >
      <span role="cell" class="history-list-table__cell-time">
        {{ formatStartedAt(entry) }}
      </span>
      <span role="cell" class="history-list-table__cell-prompt">
        <span
          v-if="entry.parentTaskId"
          class="history-list-table__fork"
          :title="
            t('history.list.forkBadgeTitle', {
              taskId: entry.parentTaskId,
              step: entry.forkedFromStep ?? '?',
            })
          "
        >
          {{ t("history.list.forkBadge") }}
        </span>
        {{ promptPreview(entry.prompt) }}
      </span>
      <span role="cell" class="history-list-table__cell-status">
        <span
          class="history-list-table__pill"
          :class="`history-list-table__pill--${statusFamily(entry.status)}`"
          :title="statusTitle(entry)"
        >
          <span
            v-if="isAwaiting(entry)"
            class="history-list-table__gate-mark"
            role="img"
            :title="t('history.questionBadge')"
            :aria-label="t('history.questionBadge')"
          >
            <span aria-hidden="true">❓</span>
          </span>
          {{ formatStatus(entry.status) }}
        </span>
      </span>
      <span role="cell" class="history-list-table__cell-mono">
        {{ formatDuration(entry.durationMs) }}
      </span>
      <span role="cell" class="history-list-table__cell-mono">
        {{ entry.pipeline_steps?.length ?? 0 }}
      </span>
      <span role="cell" class="history-list-table__cell-action">
        <button
          v-if="canResume(entry)"
          type="button"
          class="history-list-table__resume-btn"
          :disabled="resumeBusyId === entry.id"
          :title="t('history.detail.resume.tooltip', { step: '?' })"
          @click.stop="emit('resume-entry', entry)"
        >
          {{ t("history.detail.resume.button") }}
        </button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore, type HistoryEntry } from "@/shared/store/ui";
import { formatTaskStatus, isRunAwaiting } from "@/shared/lib/task-status";
import { formatEuropeanDateTime } from "@/shared/lib/format-date";
import { formatDurationOrDash } from "@/shared/lib/format-relative";
import { useI18n } from "@/shared/lib/i18n";

defineProps<{
  entries: HistoryEntry[];
  resumeBusyId: string;
  statusFamily: (status: HistoryEntry["status"]) => string;
  canResume: (entry: HistoryEntry) => boolean;
}>();

const emit = defineEmits<{
  open: [id: string];
  "resume-entry": [entry: HistoryEntry];
}>();

const { t } = useI18n();
const ui = useUiStore();

function promptPreview(prompt: string): string {
  const first = (prompt ?? "").split("\n")[0];
  return first.length > 120 ? `${first.slice(0, 119)}…` : first;
}

function formatStartedAt(entry: HistoryEntry): string {
  return formatEuropeanDateTime(entry.startedAt ?? entry.at) || "—";
}

const formatDuration = formatDurationOrDash;

function isAwaiting(entry: HistoryEntry): boolean {
  return isRunAwaiting(entry, ui);
}

function formatStatus(status?: HistoryEntry["status"]): string {
  return formatTaskStatus(t, status);
}

function statusTitle(entry: HistoryEntry): string {
  return entry.status === "artifacts_incomplete"
    ? t("history.list.artifactsIncompleteTitle")
    : "";
}
</script>

<style scoped>
.history-list-table {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-list-table__head,
.history-list-table__row {
  display: grid;
  grid-template-columns: 160px 1fr 140px 110px 80px 180px;
  align-items: center;
  gap: 16px;
  padding: 10px 14px;
}

.history-list-table__head {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-4);
  border-bottom: 1px solid var(--line);
}

.history-list-table__row {
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

.history-list-table__row:hover {
  border-color: var(--accent);
  transform: translateX(2px);
}

.history-list-table__cell-time,
.history-list-table__cell-mono {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-2);
}

.history-list-table__fork {
  display: inline-block;
  margin-right: 6px;
  padding: 0 5px;
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  vertical-align: middle;
}

.history-list-table__cell-prompt {
  font-size: 13px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-list-table__cell-status {
  font-size: 12px;
}

.history-list-table__pill {
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

.history-list-table__gate-mark {
  margin-right: 4px;
}

.history-list-table__pill--ok {
  background: var(--ok-soft);
  color: var(--ok);
}

.history-list-table__pill--fail {
  background: color-mix(in srgb, var(--error) 16%, transparent);
  color: var(--error);
}

.history-list-table__pill--warn {
  background: rgba(201, 138, 26, 0.16);
  color: var(--warn);
}

.history-list-table__pill--run {
  background: var(--accent-soft);
  color: var(--accent-2);
}

.history-list-table__pill--pending {
  background: var(--card-soft);
  color: var(--ink-3);
}

.history-list-table__cell-action {
  display: flex;
  justify-content: flex-end;
}

.history-list-table__resume-btn {
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

.history-list-table__resume-btn:hover:not(:disabled) {
  background: var(--warn, #c98a1a);
  color: var(--card, #fff);
}

.history-list-table__resume-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
