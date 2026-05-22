<template>
  <div class="logs-tab">
    <p v-if="loading" class="logs-tab__placeholder">
      {{ t("history.detail.logsLoading") }}
    </p>
    <p v-else-if="errorMessage" class="logs-tab__error">
      {{ errorMessage }}
    </p>
    <EventsFeed
      v-else
      flat
      :events="events"
      :view-mode="viewMode"
      @update:view-mode="emit('update:view-mode', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import EventsFeed from "@/widgets/task-panel/EventsFeed.vue";
import { useI18n } from "@/shared/lib/i18n";

interface RemoteEvent {
  id?: string;
  agent?: string;
  message?: string;
  timestamp?: string;
  status?: string;
}

defineProps<{
  events: RemoteEvent[];
  loading: boolean;
  errorMessage: string | null;
  viewMode: "preview" | "raw";
}>();

const emit = defineEmits<{
  (event: "update:view-mode", value: "preview" | "raw"): void;
}>();

const { t } = useI18n();
</script>

<style scoped>
.logs-tab {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
  padding: 12px;
}

.logs-tab__placeholder {
  margin: 0;
  font-size: 12px;
  color: var(--ink-4);
}

.logs-tab__error {
  margin: 0;
  font-size: 12px;
  color: var(--error);
}
</style>
