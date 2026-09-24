<template>
  <div class="history-detail-page">
    <AppHeaderContainer />
    <main class="history-detail-page__body">
      <div class="history-detail-page__navrow">
        <button type="button" class="history-detail-page__back" @click="onBack">
          ← {{ t("history.detail.backToList") }}
        </button>
      </div>

      <template v-if="entry">
        <PaneHeader :title="promptPreview" :subtitle="overviewSubtitle">
          <template #actions>
            <HistoryDetailHeaderActions
              :family="family"
              :status="effectiveStatus"
              :task-id="entry.taskId ?? ''"
              :can-show-resume="canShowResume"
              :is-resume-busy="isResumeBusy"
              :resume-step-id="resumeStepId"
              :resume-label="t('history.detail.resume.button')"
              :resume-title="
                t('history.detail.resume.tooltip', { step: resumeStepId || '?' })
              "
              @resume="onResumeFromFailedStep"
            />
          </template>
        </PaneHeader>

        <div
          v-if="isAwaiting"
          class="history-detail-page__awaiting-banner"
          role="region"
          :aria-label="t('history.questionBadge')"
        >
          <div class="history-detail-page__awaiting-header">
            <span class="history-detail-page__awaiting-badge"
              ><span aria-hidden="true">❓</span> {{ t("history.questionBadge") }}</span
            >
            <strong class="history-detail-page__awaiting-title">{{ awaitingNoticeTitle }}</strong>
            <code v-if="awaitingStepLabel" class="history-detail-page__awaiting-step">
              {{ awaitingStepLabel }}
            </code>
          </div>
          <p v-if="awaitingNoticePrompt" class="history-detail-page__awaiting-prompt">
            {{ awaitingNoticePrompt }}
          </p>

          <!-- Awaiting human gate controls -->
          <div v-if="isAwaitingHuman" class="history-detail-page__gate-controls">
            <textarea
              v-model="gateFeedback"
              class="history-detail-page__gate-textarea"
              :placeholder="t('humanGate.feedbackPlaceholder')"
              rows="2"
              :disabled="isGateSubmitting"
              data-testid="history-gate-feedback"
            />
            <div class="history-detail-page__gate-actions">
              <button
                type="button"
                class="history-detail-page__gate-btn history-detail-page__gate-btn--primary"
                :disabled="isGateSubmitting"
                data-testid="history-gate-approve"
                @click="onApproveHumanGate"
              >
                {{ t("humanGate.approve") }}
              </button>
              <button
                v-if="gateFeedback.trim()"
                type="button"
                class="history-detail-page__gate-btn history-detail-page__gate-btn--secondary"
                :disabled="isGateSubmitting"
                data-testid="history-gate-submit-changes"
                @click="onSubmitHumanChanges"
              >
                {{ t("humanGate.submitWithChanges") }}
              </button>
              <button
                type="button"
                class="history-detail-page__gate-btn history-detail-page__gate-btn--cancel"
                :disabled="isGateSubmitting"
                data-testid="history-gate-cancel"
                @click="onCancelCurrentRun"
              >
                {{ t("chat.cancelRun") }}
              </button>
              <span v-if="isGateSubmitting" class="history-detail-page__gate-submitting">
                {{ t("humanGate.submitting") }}
              </span>
            </div>
          </div>

          <!-- Awaiting shell confirm controls -->
          <div
            v-else-if="effectiveStatus === 'awaiting_shell_confirm'"
            class="history-detail-page__gate-controls"
          >
            <div class="history-detail-page__gate-actions">
              <button
                type="button"
                class="history-detail-page__gate-btn history-detail-page__gate-btn--primary"
                :disabled="isGateSubmitting"
                data-testid="history-gate-shell-allow"
                @click="onConfirmShellGate(true)"
              >
                {{ t("shellGate.allow") }}
              </button>
              <button
                type="button"
                class="history-detail-page__gate-btn history-detail-page__gate-btn--cancel"
                :disabled="isGateSubmitting"
                data-testid="history-gate-shell-reject"
                @click="onConfirmShellGate(false)"
              >
                {{ t("shellGate.reject") }}
              </button>
              <span v-if="isGateSubmitting" class="history-detail-page__gate-submitting">
                {{ t("humanGate.submitting") }}
              </span>
            </div>
          </div>

          <!-- Awaiting manual shell controls -->
          <div
            v-else-if="effectiveStatus === 'awaiting_manual_shell'"
            class="history-detail-page__gate-controls"
          >
            <div class="history-detail-page__gate-actions">
              <button
                type="button"
                class="history-detail-page__gate-btn history-detail-page__gate-btn--primary"
                :disabled="isGateSubmitting"
                data-testid="history-gate-manual-done"
                @click="onConfirmManualShellGate(true)"
              >
                {{ t("manualShellGate.done") }}
              </button>
              <button
                type="button"
                class="history-detail-page__gate-btn history-detail-page__gate-btn--cancel"
                :disabled="isGateSubmitting"
                data-testid="history-gate-manual-cancel"
                @click="onConfirmManualShellGate(false)"
              >
                {{ t("manualShellGate.cancel") }}
              </button>
              <span v-if="isGateSubmitting" class="history-detail-page__gate-submitting">
                {{ t("humanGate.submitting") }}
              </span>
            </div>
          </div>

          <div v-if="gateSubmitError" class="history-detail-page__gate-error" role="alert">
            {{ gateSubmitError }}
          </div>
        </div>

        <nav
          class="history-detail-page__tabs"
          :aria-label="t('history.detail.tabsAria')"
        >
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="history-detail-page__tab"
            :class="{ 'history-detail-page__tab--active': activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </nav>

        <div class="history-detail-page__columns">
          <section class="history-detail-page__main">
            <RunTab
              v-if="activeTab === 'run'"
              :history-entry="entry"
              :history-events="remoteEvents"
              :history-steps="remoteSteps"
              :history-failed-step="remoteFailedStep"
              :history-status="effectiveStatus"
            />
            <div
              v-else-if="activeTab === 'activity'"
              class="history-detail-page__activity"
            >
              <ToolActivityPanel :task-id="entry.taskId ?? null" />
              <ConversationPanel :task-id="entry.taskId ?? null" />
            </div>
            <RunArtifactsTab
              v-else-if="activeTab === 'artifacts'"
              :task-id="entry?.taskId ?? null"
              :workspace-root="workspaceRootForRun"
              :scenario="runScenario"
              is-history
            />
            <TokensTab
              v-else-if="activeTab === 'tokens'"
              :task-id="entry.taskId ?? null"
            />
            <GraphsTab
              v-else-if="activeTab === 'graphs'"
              :workspace-root="workspaceRootForRun"
            />
            <VisualTab
              v-else-if="activeTab === 'visual'"
              :task-id="entry.taskId ?? null"
            />
            <TraceTimeline
              v-else-if="activeTab === 'trace'"
              :task-id="entry.taskId ?? ''"
            />
          </section>

          <HistoryDetailSidebar
            :hint="hint"
            :hint-dismissed="hintDismissed"
            :hint-message="hintMessage"
            :similar-runs="similarRuns"
            :similar-heading="t('history.detail.similar.heading')"
            :empty-text="t('history.detail.similar.empty')"
            :preview-of="promptPreviewOf"
            :format-relative="formatRelative"
            @apply-hint="onApplyHint"
            @dismiss-hint="hintDismissed = true"
            @open-similar="onOpenSimilar"
          />
        </div>
      </template>

      <p v-else class="history-detail-page__placeholder">
        {{ t("history.detail.notFound") }}
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import { useRouter } from "vue-router";
import AppHeaderContainer from "@/widgets/header/AppHeaderContainer.vue";
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import HistoryDetailSidebar from "./HistoryDetailSidebar.vue";
import HistoryDetailHeaderActions from "./HistoryDetailHeaderActions.vue";
import RunTab from "@/pages/history/tabs/RunTab.vue";
import GraphsTab from "@/pages/history/tabs/GraphsTab.vue";
import TokensTab from "@/pages/history/tabs/TokensTab.vue";
import VisualTab from "@/pages/history/tabs/VisualTab.vue";
import TraceTimeline from "@/widgets/trace-timeline/TraceTimeline.vue";
import RunArtifactsTab from "@/pages/run/RunArtifactsTab.vue";
import { ToolActivityPanel } from "@/widgets/tool-activity-panel";
import ConversationPanel from "@/widgets/task-panel/ConversationPanel.vue";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useHistoryDetailActions } from "@/pages/history/tabs/useHistoryDetailActions";
import { useHistoryDetailLoad } from "./useHistoryDetailLoad";
import { useHistoryDetailTabs } from "./useHistoryDetailTabs";
import { usePatternMemoryHint } from "@/features/pattern-memory/usePatternMemoryHint";
import { useUiStore, type HistoryEntry } from "@/shared/store/ui";
import {
  isRunAwaiting,
  isTaskAwaiting,
  isTaskResumable,
  parseTaskStatus,
} from "@/shared/lib/task-status";
import { useUxStore } from "@/shared/store/ux";
import { useProjectsStore } from "@/entities/project";
import type { TaskStatus } from "@/shared/model/task-types";
import { formatDate, formatRelative, promptPreviewOf } from "./historyFormatters";
import { useI18n } from "@/shared/lib/i18n";
import { getLegacyTaskSnapshot } from "@/shared/api/endpoints/tasks";
import { SWARM_RUN_CONTROLLER_KEY } from "@/features/swarm-run";
import { cancelTask } from "@/shared/api/endpoints/tasks-runtime";
import {
  confirmManualShell,
  confirmShell,
  submitHumanResume,
} from "@/features/swarm-run/task-gate-actions";

const props = defineProps<{ runId: string }>();

const router = useRouter();
const ui = useUiStore();
const ux = useUxStore();
const settings = useInjectedAppSettings();
const controller = inject(SWARM_RUN_CONTROLLER_KEY, null);
const { t } = useI18n();

const hintDismissed = ref(false);

const fallbackRemoteEntry = ref<HistoryEntry | null>(null);

const entry = computed<HistoryEntry | null>(() => {
  const local = ui.historyList.find(
    (item) => item.id === props.runId || (item.taskId && item.taskId === props.runId),
  );
  if (local) return local;
  return fallbackRemoteEntry.value;
});

watch(
  () => props.runId,
  async (runId) => {
    fallbackRemoteEntry.value = null;
    const local = ui.historyList.find(
      (item) => item.id === runId || (item.taskId && item.taskId === runId),
    );
    if (!local && runId) {
      try {
        const snapshot = await getLegacyTaskSnapshot(runId);
        if (snapshot && (snapshot.task_id || snapshot.pipeline_steps)) {
          const raw = snapshot as Record<string, unknown>;
          const promptText =
            typeof raw.user_prompt === "string" && raw.user_prompt.trim()
              ? raw.user_prompt.trim()
              : typeof raw.prompt === "string" && raw.prompt.trim()
                ? raw.prompt.trim()
                : snapshot.task_id || runId;
          fallbackRemoteEntry.value = {
            id: snapshot.task_id || runId,
            at: Date.now(),
            prompt: promptText,
            agent_config: {},
            pipeline_steps: snapshot.pipeline_steps || [],
            taskId: snapshot.task_id || runId,
            status: (snapshot.status as TaskStatus) || null,
            error: snapshot.error ? String(snapshot.error) : null,
          };
        }
      } catch {
        fallbackRemoteEntry.value = null;
      }
    }
  },
  { immediate: true },
);

const workspaceRootForRun = computed<string>(() =>
  (entry.value?.workspace_root ?? "").trim(),
);

const runScenario = computed<string | null>(() => {
  const config = entry.value?.agent_config;
  if (config && typeof config === "object" && "scenario" in config) {
    const raw = (config as { scenario?: unknown }).scenario;
    return typeof raw === "string" ? raw : null;
  }
  return null;
});

const canShowResume = computed<boolean>(() => {
  if (!entry.value?.taskId) return false;
  return isTaskResumable(entry.value.status);
});

const {
  isResumeBusy,
  isResumeAvailable,
  resumeStepId,
  loadResumeOptions,
  onResumeFromFailedStep,
} = useHistoryDetailActions({
  ux,
  t,
  workspaceRootForRun,
  getTaskId: () => entry.value?.taskId,
});

const { activeTab, tabs } = useHistoryDetailTabs(t);

const {
  remoteEvents,
  remoteSteps,
  remoteFailedStep,
  remoteStatus,
  remotePauseDetail,
  remoteHumanStep,
  loadRemoteEvents,
} = useHistoryDetailLoad({
    entry,
    isResumeAvailable,
    resumeStepId,
    loadResumeOptions,
  });

const projects = useProjectsStore();

// The locally persisted entry status is only updated while the launching tab
// is open; runs that finish (or fail further) after a reload keep showing the
// stale badge. The backend snapshot is authoritative — sync it back.
watch(remoteStatus, (status) => {
  const taskId = entry.value?.taskId;
  if (!status || !taskId) return;
  const known = parseTaskStatus(status);
  if (!known) return;
  if ((entry.value?.status ?? "") === known) return;
  ui.updateHistoryResult(taskId, { status: known }, projects.currentId);
});

const promptPreview = computed(() =>
  entry.value ? promptPreviewOf(entry.value.prompt) : "",
);

const overviewSubtitle = computed(() =>
  entry.value ? formatDate(entry.value.startedAt ?? entry.value.at) : "",
);

const effectiveStatus = computed(() => {
  return (remoteStatus.value || entry.value?.status || "").trim();
});

// The `ui` gate text belongs to the run this browser session drives. Read it
// only for that run: another run's page used to show this run's question.
const isLiveTask = computed(
  () => !!entry.value?.taskId && entry.value.taskId === ui.taskId,
);

const isAwaiting = computed(() =>
  isRunAwaiting({ taskId: entry.value?.taskId, status: effectiveStatus.value }, ui),
);

const awaitingNoticeTitle = computed(() => {
  const s = effectiveStatus.value.toLowerCase();
  const live = isLiveTask.value;
  if (s === "awaiting_shell_confirm" || (live && ui.shellGateVisible)) {
    return t("taskMonitor.awaitingShell");
  }
  if (s === "awaiting_manual_shell" || (live && ui.manualShellGateVisible)) {
    return (live && ui.manualShellReason) || t("taskMonitor.awaitingShell");
  }
  return (live && ui.humanGateTitle) || t("chat.gatePromptTitle");
});

const awaitingNoticePrompt = computed(() => {
  if (isLiveTask.value && ui.manualShellReason) return ui.manualShellReason;
  // The run's own record of what it asked. It outlives the browser session the
  // run was started in, which the `ui` gate text does not.
  return remotePauseDetail.value;
});

const awaitingStepLabel = computed(() => remoteHumanStep.value);

const gateFeedback = ref("");
const isGateSubmitting = ref(false);
const gateSubmitError = ref<string | null>(null);

const isAwaitingHuman = computed(() => {
  const s = effectiveStatus.value.toLowerCase();
  return (
    s === "awaiting_human" ||
    (!s.includes("shell") && isAwaiting.value)
  );
});

async function onApproveHumanGate(): Promise<void> {
  const taskId = entry.value?.taskId;
  if (!taskId || isGateSubmitting.value) return;
  isGateSubmitting.value = true;
  gateSubmitError.value = null;
  const feedback = gateFeedback.value.trim() || "Approved";
  try {
    let ok = false;
    if (controller?.onHumanResume) {
      ok = await controller.onHumanResume(feedback, taskId);
    } else {
      const res = await submitHumanResume(taskId, feedback, () => undefined);
      ok = res.ok;
    }
    if (ok) {
      gateFeedback.value = "";
      await loadRemoteEvents(taskId);
      ui.updateHistoryResult(taskId, { status: "in_progress" }, projects.currentId);
      if (ui.taskId === taskId) {
        ui.humanGateVisible = false;
        ui.taskStatus = "in_progress";
      }
    } else {
      gateSubmitError.value = t("humanGate.resumeFailed", { error: "Submission failed" });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    gateSubmitError.value = t("humanGate.resumeFailed", { error: msg });
  } finally {
    isGateSubmitting.value = false;
  }
}

async function onSubmitHumanChanges(): Promise<void> {
  const taskId = entry.value?.taskId;
  if (!taskId || isGateSubmitting.value || !gateFeedback.value.trim()) return;
  isGateSubmitting.value = true;
  gateSubmitError.value = null;
  try {
    let ok = false;
    if (controller?.onHumanResume) {
      ok = await controller.onHumanResume(gateFeedback.value.trim(), taskId);
    } else {
      const res = await submitHumanResume(taskId, gateFeedback.value.trim(), () => undefined);
      ok = res.ok;
    }
    if (ok) {
      gateFeedback.value = "";
      await loadRemoteEvents(taskId);
      ui.updateHistoryResult(taskId, { status: "in_progress" }, projects.currentId);
      if (ui.taskId === taskId) {
        ui.humanGateVisible = false;
        ui.taskStatus = "in_progress";
      }
    } else {
      gateSubmitError.value = t("humanGate.resumeFailed", { error: "Submission failed" });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    gateSubmitError.value = t("humanGate.resumeFailed", { error: msg });
  } finally {
    isGateSubmitting.value = false;
  }
}

async function onConfirmShellGate(approved: boolean): Promise<void> {
  const taskId = entry.value?.taskId;
  if (!taskId || isGateSubmitting.value) return;
  isGateSubmitting.value = true;
  gateSubmitError.value = null;
  try {
    if (controller?.onConfirmShell) {
      await controller.onConfirmShell(approved, taskId);
    } else {
      await confirmShell(taskId, approved);
    }
    await loadRemoteEvents(taskId);
    if (ui.taskId === taskId) {
      ui.shellGateVisible = false;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    gateSubmitError.value = msg;
  } finally {
    isGateSubmitting.value = false;
  }
}

async function onConfirmManualShellGate(done: boolean): Promise<void> {
  const taskId = entry.value?.taskId;
  if (!taskId || isGateSubmitting.value) return;
  isGateSubmitting.value = true;
  gateSubmitError.value = null;
  try {
    if (controller?.onConfirmManualShell) {
      await controller.onConfirmManualShell(done, taskId);
    } else {
      await confirmManualShell(taskId, done);
    }
    await loadRemoteEvents(taskId);
    if (ui.taskId === taskId) {
      ui.manualShellGateVisible = false;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    gateSubmitError.value = msg;
  } finally {
    isGateSubmitting.value = false;
  }
}

async function onCancelCurrentRun(): Promise<void> {
  const taskId = entry.value?.taskId;
  if (!taskId || isGateSubmitting.value) return;
  isGateSubmitting.value = true;
  try {
    if (controller?.onStopRun && ui.taskId === taskId) {
      await controller.onStopRun();
    } else {
      await cancelTask(taskId);
    }
    await loadRemoteEvents(taskId);
    ui.updateHistoryResult(taskId, { status: "cancelled" }, projects.currentId);
    if (ui.taskId === taskId) {
      ui.taskStatus = "cancelled";
      ui.humanGateVisible = false;
      ui.shellGateVisible = false;
      ui.manualShellGateVisible = false;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    gateSubmitError.value = msg;
  } finally {
    isGateSubmitting.value = false;
  }
}

const family = computed<"ok" | "fail" | "warn" | "run" | "pending">(() => {
  if (!entry.value) return "pending";
  const status = effectiveStatus.value;
  if (status === "completed" || status === "completed_no_writes") return "ok";
  if (status === "completed_with_failures") return "warn";
  if (status === "failed" || status === "cancelled") return "fail";
  if (isTaskAwaiting(status)) return "warn";
  if (status === "running" || status === "in_progress") return "run";
  return "pending";
});

const similarRuns = computed<HistoryEntry[]>(() => {
  if (!entry.value) return [];
  const target = entry.value;
  const baseSteps = new Set(target.pipeline_steps ?? []);
  return ui.historyList
    .filter((candidate) => {
      if (candidate.id === target.id) return false;
      const candidateSteps = candidate.pipeline_steps ?? [];
      if (!candidateSteps.length || baseSteps.size === 0) return false;
      const overlap = candidateSteps.filter((step) => baseSteps.has(step)).length;
      return overlap / baseSteps.size >= 0.6;
    })
    .slice(0, 6);
});

function onBack(): void {
  void router.push("/history");
}

function onOpenSimilar(id: string): void {
  void router.push(`/history/${id}`);
}

const currentPipelineSteps = computed<string[]>(() =>
  settings.pipelineState.steps.value.map((step) => step.id),
);

const excludedFromHint = computed<Set<string>>(() => {
  const set = new Set<string>();
  if (entry.value) set.add(entry.value.id);
  return set;
});

const { hint } = usePatternMemoryHint({
  prompt: computed(() => entry.value?.prompt ?? ""),
  currentPipelineSteps,
  history: computed(() => ui.historyList),
  dismissed: excludedFromHint,
});

const hintMessage = computed(() =>
  hint.value
    ? t("patternMemory.suggestPipeline", {
        count: hint.value.pipelineSteps.length,
      })
    : "",
);

function onApplyHint(): void {
  if (!hint.value) return;
  settings.pipelineState.applyStepIds(hint.value.pipelineSteps);
  hintDismissed.value = true;
}

watch(
  () => props.runId,
  () => {
    hintDismissed.value = false;
  },
);
</script>

<style scoped>
.history-detail-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  padding-top: var(--hdr-h);
  background: var(--bg);
}

.history-detail-page__body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 20px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-detail-page__navrow {
  display: flex;
  align-items: center;
}

.history-detail-page__back {
  appearance: none;
  background: transparent;
  border: none;
  color: var(--ink-3);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
}

.history-detail-page__back:hover {
  color: var(--ink);
}

.history-detail-page__awaiting-banner {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 18px;
  border-radius: var(--r-md);
  background: var(--warn-bg, rgba(234, 179, 8, 0.12));
  border: 1px solid var(--warn, #eab308);
  color: var(--ink);
}

.history-detail-page__awaiting-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.history-detail-page__awaiting-badge {
  font-weight: 600;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.history-detail-page__awaiting-title {
  font-size: 13px;
  font-weight: 600;
}

.history-detail-page__awaiting-step {
  font-size: 12px;
  font-family: var(--font-mono, monospace);
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 4px;
}

.history-detail-page__awaiting-prompt {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink);
  white-space: pre-wrap;
}

.history-detail-page__gate-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.history-detail-page__gate-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  font-size: 13px;
  font-family: inherit;
  border: 1px solid var(--line, #ccc);
  border-radius: var(--r-sm, 4px);
  background: var(--card, #fff);
  color: var(--ink, #000);
  resize: vertical;
  min-height: 52px;
}

.history-detail-page__gate-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.history-detail-page__gate-btn {
  appearance: none;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: var(--r-sm, 4px);
  cursor: pointer;
  transition: opacity 0.15s ease, background-color 0.15s ease;
  border: 1px solid transparent;
}

.history-detail-page__gate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.history-detail-page__gate-btn--primary {
  background: var(--accent, #6366f1);
  color: #fff;
  border-color: var(--accent, #6366f1);
}

.history-detail-page__gate-btn--primary:hover:not(:disabled) {
  opacity: 0.9;
}

.history-detail-page__gate-btn--secondary {
  background: var(--card, #fff);
  color: var(--ink, #111);
  border-color: var(--line, #ccc);
}

.history-detail-page__gate-btn--secondary:hover:not(:disabled) {
  background: var(--bg-1, #f5f5f5);
}

.history-detail-page__gate-btn--cancel {
  background: transparent;
  color: var(--ink-3, #777);
  border-color: var(--line, #ccc);
}

.history-detail-page__gate-btn--cancel:hover:not(:disabled) {
  color: var(--error, #ef4444);
  border-color: var(--error, #ef4444);
}

.history-detail-page__gate-submitting {
  font-size: 12px;
  font-style: italic;
  color: var(--ink-3, #777);
}

.history-detail-page__gate-error {
  font-size: 12px;
  color: var(--error, #ef4444);
  margin-top: 4px;
}

.history-detail-page__tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--line);
}

.history-detail-page__tab {
  appearance: none;
  background: transparent;
  border: none;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-3);
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.history-detail-page__tab:hover {
  color: var(--ink);
}

.history-detail-page__tab--active {
  color: var(--ink);
  border-bottom-color: var(--accent);
}

.history-detail-page__columns {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
}

.history-detail-page__main {
  min-width: 0;
}
.history-detail-page__activity {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-detail-page__placeholder {
  margin: 0;
  font-size: 12px;
  color: var(--ink-4);
}

@media (max-width: 1100px) {
  .history-detail-page__columns {
    grid-template-columns: 1fr;
  }
}
</style>
