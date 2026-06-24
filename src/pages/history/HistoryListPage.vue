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

      <HistoryListTable
        v-else
        :entries="filteredEntries"
        :resume-busy-id="resumeBusyId"
        :status-family="statusFamily"
        :can-resume="canResume"
        @open="onOpen"
        @resume-entry="onResumeEntry"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeaderContainer from "@/widgets/header/AppHeaderContainer.vue";
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import { useUiStore } from "@/shared/store/ui";
import { useI18n } from "@/shared/lib/i18n";
import { useHistoryListActions } from "./useHistoryListActions";
import HistoryListTable from "./HistoryListTable.vue";

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
</style>
