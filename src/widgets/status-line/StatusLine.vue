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
