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
              :status="entry.status ?? ''"
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
            />
            <div
              v-else-if="activeTab === 'activity'"
              class="history-detail-page__activity"
            >
              <ToolActivityPanel :task-id="entry.taskId ?? null" />
              <ConversationPanel :task-id="entry.taskId ?? null" />
            </div>
            <RunArtifactsTab v-else-if="activeTab === 'artifacts'" />
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
import { computed, ref, watch } from "vue";
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
import { useUxStore } from "@/shared/store/ux";
import { useProjectsStore } from "@/shared/store/projects";
import type { TaskStatus } from "@/shared/model/task-types";
import { formatDate, formatRelative, promptPreviewOf } from "./historyFormatters";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{ runId: string }>();

const router = useRouter();
const ui = useUiStore();
const ux = useUxStore();
const settings = useInjectedAppSettings();
const { t } = useI18n();

const hintDismissed = ref(false);

const entry = computed<HistoryEntry | null>(() => {
  return ui.historyList.find((item) => item.id === props.runId) ?? null;
});

const workspaceRootForRun = computed<string>(() =>
  (entry.value?.workspace_root ?? "").trim(),
);

const canShowResume = computed<boolean>(() => {
  if (!entry.value?.taskId) return false;
  const status = (entry.value.status ?? "").toString().toLowerCase();
  const finishedStatuses = new Set([
    "failed",
    "cancelled",
    "awaiting_human",
    "completed_with_failures",
    "completed_no_writes",
    "in_progress",
    "running",
  ]);
  return finishedStatuses.has(status);
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

const { remoteEvents, remoteSteps, remoteFailedStep, remoteStatus } =
  useHistoryDetailLoad({
    entry,
    isResumeAvailable,
    resumeStepId,
    loadResumeOptions,
  });

const projects = useProjectsStore();

const KNOWN_TASK_STATUSES: readonly TaskStatus[] = [
  "pending",
  "running",
  "in_progress",
  "completed",
  "completed_no_writes",
  "completed_with_failures",
  "failed",
  "blocked",
  "awaiting_human",
  "awaiting_shell_confirm",
  "awaiting_manual_shell",
  "cancelled",
];

// The locally persisted entry status is only updated while the launching tab
// is open; runs that finish (or fail further) after a reload keep showing the
// stale badge. The backend snapshot is authoritative — sync it back.
watch(remoteStatus, (status) => {
  const taskId = entry.value?.taskId;
  if (!status || !taskId) return;
  if (!KNOWN_TASK_STATUSES.includes(status as TaskStatus)) return;
  if ((entry.value?.status ?? "") === status) return;
  ui.updateHistoryResult(taskId, { status: status as TaskStatus }, projects.currentId);
});

const promptPreview = computed(() =>
  entry.value ? promptPreviewOf(entry.value.prompt) : "",
);

const overviewSubtitle = computed(() =>
  entry.value ? formatDate(entry.value.startedAt ?? entry.value.at) : "",
);

const family = computed<"ok" | "fail" | "warn" | "run" | "pending">(() => {
  if (!entry.value) return "pending";
  const status = entry.value.status;
  if (status === "completed" || status === "completed_no_writes") return "ok";
  if (status === "completed_with_failures") return "warn";
  if (status === "failed" || status === "cancelled") return "fail";
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
