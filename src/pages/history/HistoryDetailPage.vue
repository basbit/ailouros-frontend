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
              :resume-busy="resumeBusy"
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
          :aria-label="t('history.detail.tab.overview')"
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
            <RunTab v-if="activeTab === 'run'" />
            <OverviewTab
              v-else-if="activeTab === 'overview'"
              :entry="entry"
              :format-date="formatDate"
              :format-duration="formatDuration"
            />
            <StepsTab
              v-else-if="activeTab === 'steps'"
              :step-rows="stepRows"
              :can-rollback="canRollback"
              :rollback-busy="rollbackBusy"
              :format-duration="formatDuration"
              @rollback="onRollbackTo"
            />
            <LogsTab
              v-else-if="activeTab === 'logs'"
              :events="remoteEvents"
              :loading="remoteEventsLoading"
              :error-message="remoteEventsError"
              :view-mode="eventsViewMode"
              @update:view-mode="eventsViewMode = $event"
            />
            <ArtifactsTab
              v-else-if="activeTab === 'artifacts'"
              :task-id="entry.taskId"
            />
            <ActivityTab
              v-else-if="activeTab === 'activity'"
              :task-id="entry.taskId ?? null"
            />
            <ConversationTab
              v-else-if="activeTab === 'conversation'"
              :messages="conversationState.messages.value"
              :loading="conversationState.loading.value"
              :error-message="conversationState.error.value"
              :not-implemented="conversationState.notImplemented.value ?? false"
              :shared-history-enabled="conversationState.sharedHistoryEnabled.value"
            />
            <SpecTab
              v-else-if="activeTab === 'spec'"
              :workspace-root="workspaceRootForRun"
              :selected-spec-id="selectedSpecId"
              :editing="specEditing"
              @node-click="onSpecNodeClick"
              @update:selected-spec-id="selectedSpecId = $event"
              @update:editing="specEditing = $event"
            />
            <GraphTab v-else-if="activeTab === 'graph'" />
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
import GraphTab from "@/pages/history/tabs/GraphTab.vue";
import OverviewTab from "@/pages/history/tabs/OverviewTab.vue";
import StepsTab from "@/pages/history/tabs/StepsTab.vue";
import LogsTab from "@/pages/history/tabs/LogsTab.vue";
import ArtifactsTab from "@/pages/history/tabs/ArtifactsTab.vue";
import ActivityTab from "@/pages/history/tabs/ActivityTab.vue";
import ConversationTab from "@/pages/history/tabs/ConversationTab.vue";
import SpecTab from "@/pages/history/tabs/SpecTab.vue";
import { useConversationHistory } from "@/features/conversation-history/useConversationHistory";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useHistoryDetailActions } from "@/pages/history/tabs/useHistoryDetailActions";
import { useHistoryDetailLoad } from "./useHistoryDetailLoad";
import { useHistoryDetailTabs } from "./useHistoryDetailTabs";
import { usePatternMemoryHint } from "@/features/pattern-memory/usePatternMemoryHint";
import { useUiStore, type HistoryEntry } from "@/shared/store/ui";
import { useUxStore } from "@/shared/store/ux";
import {
  formatDate,
  formatDuration,
  formatRelative,
  promptPreviewOf,
} from "./historyFormatters";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{ runId: string }>();

const router = useRouter();
const ui = useUiStore();
const ux = useUxStore();
const settings = useInjectedAppSettings();
const { t } = useI18n();

const hintDismissed = ref(false);
const conversationState = useConversationHistory();

const entry = computed<HistoryEntry | null>(() => {
  return ui.historyList.find((item) => item.id === props.runId) ?? null;
});

const workspaceRootForRun = computed<string>(() =>
  (entry.value?.workspace_root ?? "").trim(),
);

const canRollback = computed<boolean>(
  () => Boolean(entry.value?.taskId) && Boolean(workspaceRootForRun.value),
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
  rollbackBusy,
  resumeBusy,
  resumeAvailable,
  resumeStepId,
  loadResumeOptions,
  onRollbackTo,
  onResumeFromFailedStep,
} = useHistoryDetailActions({
  ux,
  t,
  workspaceRootForRun,
  getTaskId: () => entry.value?.taskId,
});

const { activeTab, tabs, selectedSpecId, specEditing, onSpecNodeClick } =
  useHistoryDetailTabs(t, workspaceRootForRun);

const {
  remoteEvents,
  remoteEventsLoading,
  remoteEventsError,
  eventsViewMode,
  stepRows,
} = useHistoryDetailLoad({
  entry,
  conversationState,
  resumeAvailable,
  resumeStepId,
  loadResumeOptions,
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
