<template>
  <details class="panel content-panel--history" :open="open" @toggle="onToggle">
    <summary class="panel-header">
      <span class="panel-title">{{ t("history.title") }}</span>
      <span v-if="historyList.length" class="hint" style="margin-left: 6px">
        ({{ historyList.length }})
      </span>
      <span class="hint" style="margin-left: auto">{{ t("history.autoSaved") }}</span>
    </summary>
    <div class="panel-body">
      <div v-if="historyList.length" class="history-toolbar">
        <input
          v-model="searchQuery"
          type="text"
          class="history-search"
          :placeholder="t('history.searchPlaceholder')"
        />
        <select v-model="statusFilter" class="history-filter">
          <option value="all">{{ t("history.filter.all") }}</option>
          <option value="awaiting">{{ t("history.filter.awaiting") }}</option>
          <option value="running">{{ t("history.filter.running") }}</option>
          <option value="completed">{{ t("history.filter.completed") }}</option>
          <option value="failed">{{ t("history.filter.failed") }}</option>
        </select>
      </div>
      <div class="history-list">
        <div v-if="!historyList.length" class="hint" style="padding: 4px 0">
          {{ t("history.empty") }}
        </div>
        <div v-else-if="!filteredHistory.length" class="hint" style="padding: 4px 0">
          {{ t("history.emptyFiltered") }}
        </div>
        <div v-for="h in filteredHistory" :key="h.id" class="history-item">
          <div class="meta">
            {{ new Date(h.at).toLocaleString() }}
            <template v-if="h.taskId"> · {{ h.taskId.slice(0, 8) }}…</template>
          </div>
          <div v-if="h.status || h.durationMs" class="meta meta--status">
            <span
              v-if="isAwaiting(h)"
              class="history-gate-mark"
              :title="t('history.questionBadge')"
            >
              <span aria-hidden="true">❓</span> {{ t("history.questionBadge") }}
            </span>
            <span v-if="h.status">{{ formatStatus(h.status) }}</span>
            <template v-if="h.durationMs">
              · {{ t("history.duration") }} {{ formatDuration(h.durationMs) }}
            </template>
          </div>
          <div class="snippet">
            {{ (h.prompt ?? "").slice(0, 220)
            }}{{ (h.prompt ?? "").length > 220 ? "…" : "" }}
          </div>
          <div class="row-btns">
            <button
              v-if="h.taskId"
              type="button"
              class="hist-view"
              @click="emit('viewRun', h.id)"
            >
              {{ t("history.viewRun") }}
            </button>
            <button type="button" class="hist-ctx" @click="emit('useAsContext', h.id)">
              {{ t("history.useContext") }}
            </button>
          </div>
        </div>
      </div>
      <button
        type="button"
        class="btn-danger"
        style="margin-top: 8px"
        @click="emit('clear')"
      >
        {{ t("history.clear") }}
      </button>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useUiStore, type HistoryEntry } from "@/shared/store/ui";
import { formatTaskStatus, isRunAwaiting } from "@/shared/lib/task-status";
import { useI18n } from "@/shared/lib/i18n";
import { usePersistedFlag } from "@/shared/lib/use-persisted-flag";
import { STORAGE_KEYS } from "@/shared/lib/storage-keys";

const props = defineProps<{ historyList: HistoryEntry[] }>();
const emit = defineEmits<{
  clear: [];
  useAsContext: [id: string];
  viewRun: [id: string];
}>();
const { t } = useI18n();
const ui = useUiStore();
const searchQuery = ref("");
const statusFilter = ref<"all" | "awaiting" | "running" | "completed" | "failed">("all");

const open = usePersistedFlag(STORAGE_KEYS.historyPanelOpen.key, true);

function onToggle(event: Event): void {
  open.value = (event.target as HTMLDetailsElement).open;
}

function isAwaiting(entry: HistoryEntry): boolean {
  return isRunAwaiting(entry, ui);
}

function formatStatus(status?: string | null): string {
  return formatTaskStatus(t, status, "");
}

const filteredHistory = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return props.historyList.filter((entry) => {
    const status = String(entry.status || "").toLowerCase();
    const matchesStatus =
      statusFilter.value === "all" ||
      (statusFilter.value === "awaiting"
        ? isAwaiting(entry)
        : statusFilter.value === "running"
          ? ["running", "in_progress"].includes(status)
          : status === statusFilter.value);
    if (!matchesStatus) return false;
    if (!query) return true;
    return [entry.prompt, entry.taskId, entry.error, entry.workspace_root]
      .map((value) => String(value ?? "").toLowerCase())
      .some((value) => value.includes(query));
  });
});

function formatDuration(durationMs: number): string {
  const totalSec = Math.max(0, Math.round(durationMs / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min <= 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}
</script>

<style scoped>
.history-gate-mark {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-right: 6px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(201, 138, 26, 0.16);
  color: var(--warn, #c98a1a);
  font-weight: 600;
  font-size: 11px;
}
</style>
