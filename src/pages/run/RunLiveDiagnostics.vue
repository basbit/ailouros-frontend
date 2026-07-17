<template>
  <details v-show="planVisible || diagnosticsVisible" class="run-live-diagnostics">
    <summary class="run-live-diagnostics__summary">
      {{ t("runLive.diagnostics") }}
    </summary>
    <div class="run-live-diagnostics__body">
      <RunPlanCard :task-id="taskId" @visibility="planVisible = $event" />
      <RunDiagnosticsCard
        :task-id="taskId"
        :workspace-root="workspaceRoot"
        @visibility="diagnosticsVisible = $event"
      />
    </div>
  </details>
</template>

<script setup lang="ts">
import { ref } from "vue";
import RunDiagnosticsCard from "@/widgets/run-diagnostics/RunDiagnosticsCard.vue";
import RunPlanCard from "@/widgets/run-plan/RunPlanCard.vue";
import { useI18n } from "@/shared/lib/i18n";

defineProps<{
  taskId: string | null;
  workspaceRoot: string | null;
}>();

const { t } = useI18n();

// v-show, not v-if: the cards report their own emptiness, so unmounting them
// would silence the very event that decides whether this wrapper is shown.
const planVisible = ref(false);
const diagnosticsVisible = ref(false);
</script>

<style scoped>
.run-live-diagnostics {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 8px 12px;
}

.run-live-diagnostics__summary {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-3);
  cursor: pointer;
}

.run-live-diagnostics__summary:hover {
  color: var(--ink);
}

.run-live-diagnostics__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 12px;
}
</style>
