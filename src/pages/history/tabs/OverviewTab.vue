<template>
  <div class="overview-tab">
    <DetailRow
      :label="t('history.detail.overview.prompt')"
      :value="entry.prompt"
      multiline
    />
    <DetailRow
      v-if="entry.workspace_root"
      :label="t('history.detail.overview.workspace')"
      :value="entry.workspace_root"
      mono
    />
    <DetailRow
      v-if="entry.project_context_file"
      :label="t('history.detail.overview.contextFile')"
      :value="entry.project_context_file"
      mono
    />
    <DetailRow
      v-if="entry.taskId"
      :label="t('history.detail.overview.taskId')"
      :value="entry.taskId"
      mono
    />
    <DetailRow
      :label="t('history.detail.overview.startedAt')"
      :value="formatDate(entry.startedAt ?? entry.at)"
      mono
    />
    <DetailRow
      v-if="entry.finishedAt"
      :label="t('history.detail.overview.finishedAt')"
      :value="formatDate(entry.finishedAt)"
      mono
    />
    <DetailRow
      :label="t('history.detail.overview.duration')"
      :value="formatDuration(entry.durationMs)"
      mono
    />
    <DetailRow
      v-if="entry.error"
      :label="t('history.detail.overview.error')"
      :value="entry.error"
      multiline
      emphasis="error"
    />
  </div>
</template>

<script setup lang="ts">
import DetailRow from "./DetailRow.vue";
import { useI18n } from "@/shared/lib/i18n";
import type { HistoryEntry } from "@/shared/store/ui";

defineProps<{
  entry: HistoryEntry;
  formatDate: (value: number | null | undefined) => string;
  formatDuration: (ms: number | null | undefined) => string;
}>();

const { t } = useI18n();
</script>

<style scoped>
.overview-tab {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
