<template>
  <div class="run-live-body">
    <template v-if="hasActiveTask">
      <PaneHeader v-if="!hideHeader" :title="title" :subtitle="subtitle">
        <template #actions>
          <button
            v-if="canContinue"
            type="button"
            class="run-live-body__continue"
            @click="onContinueCurrent"
          >
            {{ t("runLive.continue") }}
          </button>
          <button
            v-if="canRestart"
            type="button"
            class="run-live-body__restart"
            @click="onRestart"
          >
            {{ t("runLive.restart") }}
          </button>
          <button
            type="button"
            class="run-live-body__stop"
            :disabled="!isRunning"
            @click="onStop"
          >
            {{ t("runLive.stop") }}
          </button>
        </template>
      </PaneHeader>

      <StatusLine />

      <div class="run-live-body__metrics-row">
        <div class="run-live-body__monitor">
          <TaskMonitor />
        </div>
        <HostMetricsChart
          class="run-live-body__metrics-chart"
          :samples="ui.hostMetricsHistory"
          :gpu-name="ui.hostMetrics?.gpu_name ?? null"
        />
      </div>

      <div class="run-live-body__gates">
        <HumanGate
          :visible="ui.humanGateVisible"
          :title="ui.humanGateTitle"
          :feedback="ui.humanGateFeedback"
          :task-id="ui.taskId ?? undefined"
          :submitting="ui.humanGateSubmitting"
          @submit="onHumanResume"
          @update:feedback="ui.humanGateFeedback = $event"
        />
        <ShellGate
          :visible="ui.shellGateVisible"
          :commands="ui.shellGateCommands"
          :needs-allowlist="ui.shellGateNeedsAllowlist"
          :already-allowed="ui.shellGateAlreadyAllowed"
          @confirm="onConfirmShell"
        />
        <ManualShellGate
          :visible="ui.manualShellGateVisible"
          :commands="ui.manualShellCommands"
          :reason="ui.manualShellReason"
          @confirm="onConfirmManualShell"
        />
        <RetryGate
          :visible="ui.retryGateVisible"
          :failed-step="ui.retryFailedStep"
          :current-pipeline-steps="controller.currentPipelineSteps.value"
          @retry="onRetry"
          @continue-pipeline="onContinuePipeline"
        />
      </div>

      <div class="run-live-body__layout">
        <RunLiveStepList
          :heading="t('runLive.stepsHeading')"
          :steps="stepRows"
          :label-for="stepStateLabel"
        />
        <RunLiveLog
          :filter="logFilter"
          :filter-options="filterOptions"
          :events="filteredEvents"
          :empty-text="t('runLive.logEmpty')"
          :classify="classifyEvent"
          :format-time="formatTime"
          @update:filter="logFilter = $event"
        />
      </div>
    </template>

    <div v-else class="run-live-body__idle">
      <h2 class="run-live-body__idle-title">{{ t("runLive.idleTitle") }}</h2>
      <p class="run-live-body__idle-hint">{{ t("runLive.idleHint") }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import StatusLine from "@/widgets/status-line/StatusLine.vue";
import { TaskMonitor } from "@/widgets/task-monitor";
import HostMetricsChart from "@/shared/components/HostMetricsChart.vue";
import HumanGate from "@/features/task-gate/HumanGate.vue";
import ShellGate from "@/features/task-gate/ShellGate.vue";
import ManualShellGate from "@/features/task-gate/ManualShellGate.vue";
import RetryGate from "@/features/task-gate/RetryGate.vue";
import RunLiveStepList from "./RunLiveStepList.vue";
import RunLiveLog from "./RunLiveLog.vue";
import { useRunLiveSteps, type LogFilter, type StepState } from "./useRunLiveSteps";
import { useUiStore } from "@/shared/store/ui";
import { useInjectedSwarmRunController } from "@/features/swarm-run/swarmRunContext";
import { useI18n } from "@/shared/lib/i18n";

withDefaults(
  defineProps<{
    hideHeader?: boolean;
  }>(),
  { hideHeader: false },
);

const ui = useUiStore();
const controller = useInjectedSwarmRunController();
const { t } = useI18n();

const logFilter = ref<LogFilter>("all");

const isRunning = computed(() => controller.isRunning.value);
const hasActiveTask = computed(() => !!ui.taskId || isRunning.value);

const canContinue = computed(() => {
  if (!ui.taskId) return false;
  if (isRunning.value) return false;
  const status = ui.taskStatus;
  return (
    status === "failed" ||
    status === "blocked" ||
    status === "completed_with_failures" ||
    status === "awaiting_human" ||
    status === "awaiting_shell_confirm" ||
    status === "awaiting_manual_shell"
  );
});

const canRestart = computed(() => {
  if (!ui.taskId) return false;
  if (isRunning.value) return false;
  const status = ui.taskStatus;
  return (
    status === "completed" ||
    status === "completed_with_failures" ||
    status === "failed" ||
    status === "cancelled"
  );
});

const filterOptions = computed<Array<{ key: LogFilter; label: string }>>(() => [
  { key: "all", label: t("runLive.logFilter.all") },
  { key: "errors", label: t("runLive.logFilter.errors") },
  { key: "files", label: t("runLive.logFilter.files") },
]);

const {
  filteredEvents,
  stepRows,
  totalSteps,
  currentStepIndex,
  classifyEvent,
  formatTime,
} = useRunLiveSteps({ ui, controller, isRunning, logFilter });

function stepStateLabel(state: StepState): string {
  return t(`runLive.${state}Step`);
}

const title = computed(() => t("runLive.title"));
const subtitle = computed(() =>
  totalSteps.value
    ? t("runLive.subtitleStep", {
        current: currentStepIndex.value,
        total: totalSteps.value,
      })
    : "",
);

function onStop(): void {
  void controller.onStopRun();
}

function onContinueCurrent(): void {
  void controller.onContinuePipeline([]);
}

function onHumanResume(feedback: string): void {
  void controller.onHumanResume(feedback);
}

function onConfirmShell(approved: boolean): void {
  void controller.onConfirmShell(approved);
}

function onConfirmManualShell(done: boolean): void {
  void controller.onConfirmManualShell(done);
}

function onRetry(fromBeginning: boolean): void {
  void controller.onRetry(fromBeginning);
}

function onContinuePipeline(additionalSteps: string[]): void {
  void controller.onContinuePipeline(additionalSteps);
}

function onRestart(): void {
  void controller.onRetry(true);
}
</script>

<style scoped>
.run-live-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  flex: 1 1 auto;
}

.run-live-body__metrics-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
  gap: 12px;
  align-items: stretch;
}

.run-live-body__monitor {
  border-radius: var(--r-lg);
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--card);
  padding: 8px 10px;
}

.run-live-body__metrics-chart {
  align-self: stretch;
}

.run-live-body__continue,
.run-live-body__restart,
.run-live-body__stop {
  appearance: none;
  padding: 6px 14px;
  border-radius: var(--r-md);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  margin-right: 6px;
}

.run-live-body__continue {
  border: 1px solid transparent;
  background: var(--accent);
  color: #fff;
}

.run-live-body__continue:hover {
  filter: brightness(1.05);
}

.run-live-body__restart {
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
}

.run-live-body__restart:hover {
  border-color: var(--line-strong);
}

.run-live-body__stop {
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--error);
  margin-right: 0;
}

.run-live-body__stop:hover:not(:disabled) {
  background: color-mix(in srgb, var(--error) 10%, transparent);
}

.run-live-body__stop:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.run-live-body__layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  min-height: 0;
  flex: 1 1 auto;
}

.run-live-body__idle {
  margin: auto;
  text-align: center;
  padding: 48px 16px;
}

.run-live-body__idle-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 400;
  color: var(--ink);
  margin-bottom: 6px;
}

.run-live-body__idle-hint {
  font-size: 13px;
  color: var(--ink-3);
  margin: 0;
}

@media (max-width: 1100px) {
  .run-live-body__layout,
  .run-live-body__metrics-row {
    grid-template-columns: 1fr;
  }
}
</style>
