<template>
  <div class="run-tab">
    <RunLiveBody
      hide-header
      :history-entry="historyEntry"
      :history-events="historyEvents"
      :history-steps="historySteps"
      :history-failed-step="historyFailedStep"
    />
  </div>
</template>

<script setup lang="ts">
import RunLiveBody from "@/pages/run/RunLiveBody.vue";
import type { EventRow } from "@/pages/run/useRunLiveSteps";
import type { HistoryEntry } from "@/shared/store/ui";

withDefaults(
  defineProps<{
    historyEntry?: HistoryEntry | null;
    historyEvents?: EventRow[];
    historySteps?: string[] | null;
    historyFailedStep?: string | null;
  }>(),
  {
    historyEntry: null,
    historyEvents: () => [],
    historySteps: null,
    historyFailedStep: null,
  },
);
</script>

<style scoped>
.run-tab {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
