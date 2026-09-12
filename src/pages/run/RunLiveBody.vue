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

      <div v-if="!isHistoryView" class="run-live-body__chips-row">
        <SpecStatusChip :status="specStatus" />
        <GitStatusMicroWidget
          :workspace-root="currentWorkspaceRoot ?? undefined"
          :task-id="ui.taskId ?? undefined"
        />
      </div>

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

      <CheckpointPreview v-if="!isHistoryView" :preview="checkpointPreview" />

      <TaskGatesOverlay
        v-if="!isHistoryView"
        :current-pipeline-steps="controller.currentPipelineSteps.value"
        @human-resume="onHumanResume"
        @confirm-shell="onConfirmShell"
        @confirm-manual-shell="onConfirmManualShell"
        @retry="onRetry"
        @continue-pipeline="onContinuePipeline"
      />

      <TerminalPanel
        v-if="!isHistoryView"
        class="run-live-body__terminal"
        :workspace-root="currentWorkspaceRoot ?? undefined"
      />

      <div class="run-live-body__layout">
        <RunLiveStepList
          :heading="t('runLive.stepsHeading')"
          :steps="stepRows"
          :label-for="stepStateLabel"
          :task-id="props.historyEntry?.taskId ?? ui.taskId"
        />
        <div class="run-live-body__log">
          <div class="run-live-body__log-view">
            <button
              type="button"
              class="run-live-body__log-toggle"
              :class="{ 'run-live-body__log-toggle--active': logView === 'steps' }"
              @click="logView = 'steps'"
            >
              {{ t("runLive.logViewSteps") }}
            </button>
            <button
              type="button"
              class="run-live-body__log-toggle"
              :class="{ 'run-live-body__log-toggle--active': logView === 'flat' }"
              @click="logView = 'flat'"
            >
              {{ t("runLive.logViewFlat") }}
            </button>
          </div>
          <RunStepLog
            v-if="logView === 'steps'"
            :filter="logFilter"
            :filter-options="filterOptions"
            :groups="stepGroups"
            :empty-text="t('runLive.logEmpty')"
            :empty-step-text="t('runLive.logStepEmpty')"
            :classify="classifyEvent"
            :format-time="formatTime"
            @update:filter="logFilter = $event"
          />
          <RunLiveLog
            v-else
            :filter="logFilter"
            :filter-options="filterOptions"
            :events="filteredEvents"
            :empty-text="t('runLive.logEmpty')"
            :classify="classifyEvent"
            :format-time="formatTime"
            @update:filter="logFilter = $event"
          />
        </div>
      </div>

      <PhaseGateCard
        v-if="!isHistoryView"
        :workspace-root="currentWorkspaceRoot"
        :task-id="diagnosticsTaskId"
      />

      <RunLiveDiagnostics
        :task-id="diagnosticsTaskId"
        :workspace-root="currentWorkspaceRoot"
      />
    </template>

    <RunUnavailableBanner
      v-else-if="isRunUnavailable"
      :availability="ui.runAvailability"
      :task-id="ui.taskId ?? ''"
      :lookup-error="ui.runAvailabilityError"
      @reset="onResetUnavailableRun"
    />

    <div v-else class="run-live-body__idle">
      <h2 class="run-live-body__idle-title">{{ t("runLive.idleTitle") }}</h2>
      <p class="run-live-body__idle-hint">{{ t("runLive.idleHint") }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import StatusLine from "@/widgets/status-line/StatusLine.vue";
import { TaskMonitor } from "@/widgets/task-monitor";
import HostMetricsChart from "@/shared/components/HostMetricsChart.vue";
import TaskGatesOverlay from "@/features/task-gate/TaskGatesOverlay.vue";
import TerminalPanel from "@/widgets/terminal/TerminalPanel.vue";
import RunLiveStepList from "./RunLiveStepList.vue";
import RunStepLog from "./RunStepLog.vue";
import RunLiveLog from "./RunLiveLog.vue";
import RunLiveDiagnostics from "./RunLiveDiagnostics.vue";
import PhaseGateCard from "@/widgets/phase-gate-card/PhaseGateCard.vue";
import { RunUnavailableBanner } from "@/features/run-recovery";
import { type EventRow } from "./useRunLiveSteps";
import { type HistoryEntry } from "@/shared/store/ui";
import CheckpointPreview from "@/widgets/checkpoint-preview/CheckpointPreview.vue";
import SpecStatusChip from "@/widgets/spec-status-chip/SpecStatusChip.vue";
import GitStatusMicroWidget from "@/widgets/git-status/GitStatusMicroWidget.vue";
import { readRunSnapshotSection } from "@/shared/model/run-snapshot";
import { useRunLiveBody } from "./useRunLiveBody";

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

const {
  ui,
  controller,
  t,
  logFilter,
  logView,
  isHistoryView,
  isRunning,
  hasActiveTask,
  isRunUnavailable,
  onResetUnavailableRun,
  currentWorkspaceRoot,
  diagnosticsTaskId,
  canContinue,
  canRestart,
  filterOptions,
  filteredEvents,
  stepRows,
  stepGroups,
  classifyEvent,
  formatTime,
  stepStateLabel,
  title,
  subtitle,
  onStop,
  onContinueCurrent,
  onHumanResume,
  onConfirmShell,
  onConfirmManualShell,
  onRetry,
  onContinuePipeline,
  onRestart,
} = useRunLiveBody(props);

const checkpointPreview = computed(() =>
  readRunSnapshotSection(ui.taskPipelinePlan, "checkpoint_preview"),
);

const specStatus = computed(() =>
  readRunSnapshotSection(ui.taskPipelinePlan, "session_spec_status"),
);
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

.run-live-body__chips-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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

.run-live-body__log {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.run-live-body__log-view {
  display: inline-flex;
  gap: 2px;
  align-self: flex-end;
  padding: 2px;
  border-radius: 999px;
  background: var(--bg-2);
  border: 1px solid var(--line);
}

.run-live-body__log-toggle {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--ink-3);
  font-size: 11px;
  font-weight: 500;
  padding: 3px 12px;
  border-radius: 999px;
  cursor: pointer;
}

.run-live-body__log-toggle--active {
  background: var(--accent);
  color: #fff;
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
