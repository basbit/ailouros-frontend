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

      <StatusLine v-if="!isHistoryView" />

      <div v-if="!isHistoryView" class="run-live-body__metrics-row">
        <div class="run-live-body__monitor">
          <TaskMonitor />
        </div>
        <HostMetricsChart
          class="run-live-body__metrics-chart"
          :samples="ui.hostMetricsHistory"
          :gpu-name="ui.hostMetrics?.gpu_name ?? null"
        />
      </div>

      <RunLiveGates
        v-if="!isHistoryView"
        :current-pipeline-steps="controller.currentPipelineSteps.value"
        @human-resume="onHumanResume"
        @confirm-shell="onConfirmShell"
        @confirm-manual-shell="onConfirmManualShell"
        @retry="onRetry"
        @continue-pipeline="onContinuePipeline"
      />

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

      <PhaseGateCard :workspace-root="currentWorkspaceRoot" />

      <RunLiveDiagnostics
        :task-id="diagnosticsTaskId"
        :workspace-root="currentWorkspaceRoot"
      />
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
import RunLiveGates from "./RunLiveGates.vue";
import RunLiveStepList from "./RunLiveStepList.vue";
import RunLiveLog from "./RunLiveLog.vue";
import RunLiveDiagnostics from "./RunLiveDiagnostics.vue";
import PhaseGateCard from "@/widgets/phase-gate-card/PhaseGateCard.vue";
import {
  useRunLiveSteps,
  type EventRow,
  type HistorySource,
  type LogFilter,
  type StepState,
} from "./useRunLiveSteps";
import { useUiStore, type HistoryEntry } from "@/shared/store/ui";
import { useInjectedSwarmRunController } from "@/features/swarm-run";
import { useI18n } from "@/shared/lib/i18n";

const props = withDefaults(
  defineProps<{
    hideHeader?: boolean;
    /**
     * When viewing a past run (history detail), the run to render. Steps + log
     * are then sourced from this entry + `historyEvents` instead of the live
     * ui store, leaving the live Run page untouched.
     */
    historyEntry?: HistoryEntry | null;
    historyEvents?: EventRow[];
    /**
     * Steps actually executed by the run (from the task snapshot). The entry's
     * own pipeline_steps are what the UI was configured with at launch and may
     * differ from the resolved scenario — the snapshot wins when present.
     */
    historySteps?: string[] | null;
    /** Step the run failed at (snapshot `failed_step`). */
    historyFailedStep?: string | null;
  }>(),
  {
    hideHeader: false,
    historyEntry: null,
    historyEvents: () => [],
    historySteps: null,
    historyFailedStep: null,
  },
);

const ui = useUiStore();
const controller = useInjectedSwarmRunController();
const { t } = useI18n();

const logFilter = ref<LogFilter>("all");

const isHistoryView = computed(() => props.historyEntry !== null);

const historySource = computed<HistorySource | null>(() => {
  const entry = props.historyEntry;
  if (!entry) return null;
  return {
    pipelineSteps: props.historySteps?.length
      ? props.historySteps
      : (entry.pipeline_steps ?? []),
    events: props.historyEvents,
    failedStep: props.historyFailedStep ?? null,
  };
});

const isRunning = computed(() =>
  isHistoryView.value ? false : controller.isRunning.value,
);
const hasActiveTask = computed(
  () => isHistoryView.value || !!ui.taskId || controller.isRunning.value,
);

const currentWorkspaceRoot = computed(() => {
  if (props.historyEntry) return props.historyEntry.workspace_root ?? null;
  const entry = ui.historyList.find((item) => item.taskId === ui.taskId);
  return entry?.workspace_root ?? null;
});

const diagnosticsTaskId = computed<string | null>(() =>
  props.historyEntry ? (props.historyEntry.taskId ?? null) : (ui.taskId ?? null),
);

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
} = useRunLiveSteps({ ui, controller, isRunning, logFilter, history: historySource });

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

/* No flex-shrink here: with `flex: 1 1 auto; min-height: 0` the grid used to
   collapse inside the viewport-height page column, its content kept painting
   (overflow: visible) and the cards below (PhaseGateCard, RunLiveDiagnostics)
   were laid out on top of the overflowing log/steps. The page scrolls instead;
   the log panel caps its own height (see RunLiveLog). */
.run-live-body__layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
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
