<template>
  <div
    v-if="ui.taskId"
    class="status-line"
    :class="{ 'status-line--terminal': !isActive }"
  >
    <span class="sl-item sl-task" :title="t('status.task')">
      <span class="sl-label">{{ t("status.task") }}</span>
      <code>{{ shortTaskId }}</code>
    </span>
    <template v-if="isActive">
      <span class="sl-sep">·</span>
      <span class="sl-item" :title="t('status.step')">
        <span class="sl-label">{{ t("status.step") }}</span>
        <code>{{ ui.activeStep ?? "—" }}</code>
      </span>
      <span class="sl-sep">·</span>
      <span class="sl-item" :title="t('status.mode')">
        <span class="sl-label">{{ t("status.mode") }}</span>
        <code>{{ ui.contextMode ?? "—" }}</code>
      </span>
      <span class="sl-sep">·</span>
      <span
        class="sl-item"
        :class="ui.toolsEnabled ? 'sl-ok' : 'sl-warn'"
        :title="t('status.tools')"
      >
        <span class="sl-label">{{ t("status.tools") }}</span>
        <code>{{ ui.toolsEnabled ? "ON" : "OFF" }}</code>
      </span>
      <span class="sl-sep">·</span>
      <span class="sl-item" :class="mcpPhaseClass" title="MCP phase">
        <span class="sl-label">MCP</span>
        <code>{{ ui.mcpPhase ?? "—" }}</code>
      </span>
      <span v-if="ui.pendingApprovals > 0" class="sl-sep">·</span>
      <span
        v-if="ui.pendingApprovals > 0"
        class="sl-item sl-warn"
        :title="t('status.approvals')"
      >
        <span class="sl-label">{{ t("status.approvals") }}</span>
        <code>{{ ui.pendingApprovals }}</code>
      </span>
    </template>
    <template v-else>
      <span class="sl-sep">·</span>
      <span class="sl-item" :class="terminalTone">
        <span class="sl-label">{{ terminalLabel }}</span>
        <code>{{ ui.activeStep ?? failedStep ?? "—" }}</code>
      </span>
      <span v-if="durationText" class="sl-sep">·</span>
      <span v-if="durationText" class="sl-item">
        <span class="sl-label">{{ t("status.duration") }}</span>
        <code>{{ durationText }}</code>
      </span>
      <span v-if="ui.artifactPath" class="sl-sep">·</span>
      <span v-if="ui.artifactPath" class="sl-item">
        <span class="sl-label">{{ t("status.artifacts") }}</span>
        <code>pipeline.json</code>
      </span>
      <span v-if="errorText" class="sl-sep">·</span>
      <span v-if="errorText" class="sl-item sl-err sl-item--error" :title="errorText">
        <span class="sl-label">{{ t("status.error") }}</span>
        <code>{{ errorText }}</code>
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUiStore } from "@/shared/store/ui";
import { useI18n } from "@/shared/lib/i18n";

const ui = useUiStore();
const { t } = useI18n();

const isActive = computed(() => {
  const s = ui.taskStatus;
  return (
    s === "running" ||
    s === "in_progress" ||
    s === "awaiting_human" ||
    s === "awaiting_shell_confirm"
  );
});

const shortTaskId = computed(() => (ui.taskId ? ui.taskId.slice(0, 8) : ""));

const failedStep = computed(() => {
  const plan = ui.taskPipelinePlan;
  return String(plan?.failed_step || ui.retryFailedStep || "").trim() || null;
});

const durationText = computed(() => {
  const entry = ui.historyList.find((item) => item.taskId === ui.taskId);
  const durationMs = entry?.durationMs ?? null;
  if (!durationMs) return "";
  const totalSec = Math.max(0, Math.round(durationMs / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
});

const errorText = computed(() => {
  const err = ui.taskError;
  if (!err) return "";
  const text = String(err);
  return text.length > 80 ? `${text.slice(0, 77)}…` : text;
});

const terminalLabel = computed(() => {
  const status = ui.taskStatus;
  if (status === "completed") return t("status.completed");
  if (status === "failed") return t("status.failed");
  if (status === "cancelled") return t("status.cancelled");
  if (status === "awaiting_human") return t("status.awaitingHuman");
  return t("status.step");
});

const terminalTone = computed(() => {
  const status = ui.taskStatus;
  if (status === "completed") return "sl-ok";
  if (status === "failed" || status === "cancelled") return "sl-err";
  if (status === "awaiting_human") return "sl-warn";
  return "";
});

const mcpPhaseClass = computed(() => {
  const p = ui.mcpPhase;
  if (!p) return "";
  if (p === "ready") return "sl-ok";
  if (p === "failed") return "sl-err";
  return "";
});
</script>

<style scoped>
.status-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  padding: 6px 10px;
  margin: 4px 0 8px;
  font-size: 12px;
  color: var(--text2);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.status-line--terminal {
  background: color-mix(in srgb, var(--surface2) 92%, transparent);
}
.sl-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  line-height: 1.3;
}
.sl-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text3);
}
.sl-item code {
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 11.5px;
  color: var(--text);
  background: transparent;
  padding: 0;
}
.sl-task code {
  padding: 1px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
  color: var(--text);
  font-weight: 500;
}
.sl-sep {
  color: var(--text3);
  opacity: 0.5;
  user-select: none;
}
.sl-ok code {
  color: var(--success);
}
.sl-warn code {
  color: var(--warning);
}
.sl-err code {
  color: var(--error);
}
.sl-item--error code {
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: bottom;
}
</style>
