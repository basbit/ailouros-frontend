<template>
  <div class="sidebar-run-status">
    <div v-if="taskError" class="task-error-banner">
      <strong>{{ t("status.error") }}:</strong> {{ taskError }}
    </div>

    <div v-if="blockedReason" class="task-blocked-banner">
      <strong>{{ t("status.blocked") }}</strong>
      <span v-if="blockedStep"> · {{ blockedStep }}</span>
      <span v-if="blockedCode"> [{{ blockedCode }}]</span>
      <div class="task-blocked-reason">{{ blockedReason }}</div>
    </div>

    <div v-if="scenarioId" class="task-scenario-badge">
      <span class="task-scenario-badge__label">{{ t("scenarios.runningAs") }}</span>
      <span class="task-scenario-badge__title">
        {{ scenarioTitle ?? scenarioId }}
      </span>
      <span v-if="scenarioCategory" class="task-scenario-badge__category">
        {{ t(`scenarios.tab.${scenarioCategory}`) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

defineProps<{
  taskError: unknown;
  blockedReason: string | null | undefined;
  blockedStep: string | null | undefined;
  blockedCode: string | null | undefined;
  scenarioId: string | null | undefined;
  scenarioTitle: string | null | undefined;
  scenarioCategory: string | null | undefined;
}>();

const { t } = useI18n();
</script>

<style scoped>
.sidebar-run-status {
  display: contents;
}
.task-scenario-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  margin: 6px 0;
  background: color-mix(in srgb, var(--accent, #3b5bdb) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent, #3b5bdb) 50%, transparent);
  border-radius: 999px;
  font-size: 11px;
  color: var(--text, #f5f0e7);
}
.task-scenario-badge__label {
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 10px;
}
.task-scenario-badge__title {
  font-weight: 600;
}
.task-scenario-badge__category {
  padding: 1px 6px;
  background: color-mix(in srgb, var(--accent, #3b5bdb) 35%, transparent);
  border-radius: 4px;
  font-size: 10px;
}
.task-error-banner {
  background: color-mix(in srgb, var(--error, #d7563f) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--error, #d7563f) 40%, transparent);
  border-radius: 10px;
  padding: 10px 12px;
  margin: 8px 0;
  color: var(--text, #f5f0e7);
  font-size: 0.875rem;
  word-break: break-word;
}
.task-blocked-banner {
  background: color-mix(in srgb, #d7563f 10%, transparent);
  border: 1px solid color-mix(in srgb, #d7563f 45%, transparent);
  border-radius: 10px;
  padding: 10px 12px;
  margin: 8px 0;
  color: var(--text, #f5f0e7);
  font-size: 0.875rem;
  word-break: break-word;
}
.task-blocked-reason {
  margin-top: 4px;
  color: var(--text2, #c9c2b5);
}
</style>
