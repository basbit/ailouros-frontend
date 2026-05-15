<template>
  <div
    class="swarm-vue-host"
    :class="{ 'swarm-vue-host--sidebar-collapsed': preferences.sidebarCollapsed }"
  >
    <FirstRunGate />

    <AppHeader
      :task-id="ui.taskId"
      :is-running="isRunning"
      :project-name="currentProjectName"
      :current-project-id="projectsStore.currentId"
      :project-list="projectsStore.projectList"
      :agent-editor-active="activeView === 'agent-editor'"
      @toggle-agent-editor="toggleAgentEditor()"
      @open-settings="settingsDrawerOpen = true"
      @close-task="onCloseLoadedTask"
      @project-change="projectForm.onProjectChange"
      @project-new="projectForm.onNewProject"
      @project-rename="projectForm.onRenameProjectById"
      @project-delete="projectForm.onDeleteProjectById"
      @project-edit="projectForm.onEditProjectById"
    />

    <SwarmUiModals
      :project-form-open="projectForm.projectFormOpen.value"
      :project-form-mode="projectForm.projectFormMode.value"
      :project-form-initial="projectForm.projectFormInitial.value"
      :capabilities="ui.capabilities"
      :settings-drawer-open="settingsDrawerOpen"
      :profiles="settings.profilesState.profiles.value"
      :remote-api-provider="settings.form.remote_api_provider"
      :remote-api-key="settings.form.remote_api_key"
      :remote-api-base-url="settings.form.remote_api_base_url"
      :prompt-library-open="dialogs.promptLibraryOpen.value"
      :prompt-library-entries="dialogs.promptLibraryEntries.value"
      :asset-upload-open="dialogs.assetUploadOpen.value"
      :workspace-root="settings.form.workspace_root"
      :report-problem-open="dialogs.reportProblemOpen.value"
      :task-id="ui.taskId"
      :task-scenario-id="ui.taskScenarioId"
      :task-scenario-title="ui.taskScenarioTitle"
      :task-status="ui.taskStatus ?? null"
      :task-error="ui.taskError"
      :report-recent-log="dialogs.reportRecentLog.value"
      :report-artifact-paths="dialogs.reportArtifactPaths.value"
      :sudo-prompt-open="dialogs.sudoPromptOpen.value"
      :manual-sudo-command="dialogs.manualSudoCommand.value"
      @update:project-form-open="projectForm.projectFormOpen.value = $event"
      @project-form-submit="projectForm.onProjectFormSubmit"
      @update:settings-drawer-open="settingsDrawerOpen = $event"
      @profile-add="settings.profilesState.addProfile()"
      @profile-remove="(idx) => settings.profilesState.removeProfile(idx)"
      @profile-update="onProfileUpdate"
      @prompt-library-pick="dialogs.onPromptLibraryPick"
      @prompt-library-remove="dialogs.promptLibrary.remove"
      @prompt-library-save-current="dialogs.onPromptLibrarySaveCurrent"
      @prompt-library-close="dialogs.promptLibrary.closePanel"
      @asset-uploaded="dialogs.onAssetUploaded"
      @asset-upload-close="dialogs.assetUploadOpen.value = false"
      @report-problem-close="dialogs.reportProblemOpen.value = false"
      @sudo-prompt-confirm="dialogs.onSudoPromptConfirm"
      @sudo-prompt-cancel="dialogs.sudoPromptOpen.value = false"
    />

    <div class="app-body">
      <aside class="sidebar">
        <div class="sidebar-scroll">
          <SwarmUiSidebarPrompt
            :settings="settings"
            :scenario-inputs="scenarioPreview.preview.value?.scenario.inputs ?? []"
            :scenario-input-values="scenarioActions.scenarioInputValues.value"
            :scenario-preview-title="scenarioPreviewTitle"
            :is-running="isRunning"
            :advanced-sidebar-open="artifactsState.advancedSidebarOpen.value"
            :scenario-readiness-ready="scenarioReadiness.ready.value"
            :scenario-readiness-scenario="scenarioReadiness.scenario.value"
            :missing-keys="scenarioReadiness.missingKeys.value"
            :manual-sudo-command="dialogs.manualSudoCommand.value"
            :current-pipeline-steps="currentPipelineSteps"
            @open-prompt-library="dialogs.promptLibrary.openPanel()"
            @open-asset-upload="dialogs.openAssetUpload"
            @open-report-problem="dialogs.onOpenReportProblem"
            @update:prompt="onPromptUpdate"
            @scenario-input-update="scenarioActions.onScenarioInputUpdate"
            @toggle-advanced-sidebar="artifactsState.onToggleAdvancedSidebar"
            @append-to-prompt="onAppendToPrompt"
            @update:human-manual-review="onHumanManualReviewUpdate"
            @swarm-form-update="roleHandlers.onSwarmFormUpdate"
            @start-run="onStartRun"
            @stop-run="onStopRun"
            @human-resume="onHumanResume"
            @confirm-shell="onConfirmShell"
            @open-sudo-prompt="dialogs.sudoPromptOpen.value = true"
            @confirm-manual-shell="onConfirmManualShell"
            @retry="onRetry"
            @continue-pipeline="onContinuePipeline"
          />

          <SwarmUiSidebarRoles
            :settings="settings"
            :profile-options="profileOptions"
            :skills-catalog-ids="skillsCatalogIds"
            :media-form="mediaForm"
            :on-auto-assign-models="roleHandlers.onAutoAssignModels"
            @role-env-change="roleHandlers.onRoleEnvChange"
            @role-profile-change="roleHandlers.onRoleProfileChange"
            @role-model-sel-change="roleHandlers.onRoleModelSelChange"
            @role-model-custom-input="roleHandlers.onRoleModelCustomInput"
            @role-prompt-sel-change="roleHandlers.onRolePromptSelChange"
            @role-prompt-custom-input="roleHandlers.onRolePromptCustomInput"
            @role-skill-ids-input="roleHandlers.onRoleSkillIdsInput"
            @swarm-form-update="roleHandlers.onSwarmFormUpdate"
          />
        </div>
      </aside>

      <SwarmUiMain
        :settings="settings"
        :global-settings="globalSettings"
        :first-run-scenario-panel-visible="firstRunScenarioPanelVisible"
        :effective-pipeline-steps="effectivePipelineSteps"
        :active-step-for-graph="activeStepForGraph"
        :completed-steps-from-history="completedStepsFromHistory"
        :failed-step-for-graph="failedStepForGraph"
        :retrying-steps-for-graph="retryingStepsForGraph"
        :blocked-step-for-graph="blockedStepForGraph"
        :is-custom-scenario="isCustomScenario"
        :scenario-graph-workspace-write="scenarioGraphWorkspaceWrite"
        :scenario-graph-gates="scenarioGraphGates"
        :scenario-graph-tools="scenarioGraphTools"
        :scenario-graph-warning-tools="scenarioGraphWarningTools"
        :is-running="isRunning"
        :background-agent-remote-config="backgroundAgentRemoteConfig"
        :task-history="taskHistory"
        :artifacts-open="artifactsState.artifactsOpen.value"
        :clarify-cache-provenance="clarifyCacheProvenance"
        :workspace-identity-resolved="workspaceIdentityResolved"
        :visual-probe-manifest="visualProbeManifest"
        :research-sources-text="researchSourcesText"
        :code-review-findings-text="codeReviewFindingsText"
        @onboarding-model-assignments="roleHandlers.onOnboardingModelAssignments"
        @first-run-scenario-pick="scenarioActions.onFirstRunScenarioPick"
        @first-run-scenario-skip="scenarioActions.onFirstRunScenarioSkip"
        @swarm-form-update="roleHandlers.onSwarmFormUpdate"
        @reset-recommended-steps="onResetRecommendedSteps"
        @scenario-chip-select="scenarioActions.onScenarioChipSelect"
        @copy-scenario-to-custom="scenarioActions.onCopyScenarioToCustom"
        @select-custom-scenario="scenarioActions.onSelectCustomScenario"
        @save-custom-scenario="scenarioActions.onSaveCustomScenario"
        @events-view-mode="onEventsViewMode"
        @artifacts-toggle="artifactsState.onArtifactsToggle"
        @clear-history="onClearHistory"
        @use-history-as-context="onUseHistoryAsContext"
        @view-history-run="onViewHistoryRun"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from "vue";
import type { Ref } from "vue";
import { useProjectsStore } from "@/shared/store/projects";
import { useUiStore } from "@/shared/store/ui";
import { useTaskStore } from "@/shared/store/task";
import { useSettings } from "@/widgets/settings/useSettings";
import { useSwarmRunController } from "@/features/swarm-run/useSwarmRunController";
import { usePreferencesStore } from "@/shared/store/preferences";
import { useSettingsHotReload } from "@/shared/lib/use-settings-hot-reload";
import { useGlobalSettings } from "@/features/global-settings/useGlobalSettings";
import { usePipelineGraphState } from "@/pages/swarm-ui/usePipelineGraphState";

import AppHeader from "@/widgets/header/AppHeader.vue";
import { FirstRunGate } from "@/features/onboarding-desktop";
import SwarmUiModals from "@/widgets/swarm-ui/SwarmUiModals.vue";
import SwarmUiSidebarPrompt from "@/widgets/swarm-ui/SwarmUiSidebarPrompt.vue";
import SwarmUiSidebarRoles from "@/widgets/swarm-ui/SwarmUiSidebarRoles.vue";
import SwarmUiMain from "@/widgets/swarm-ui/SwarmUiMain.vue";
import { useScenarioRunReadiness } from "@/features/scenario-picker";
import { useSwarmUiDialogs } from "@/widgets/swarm-ui/useSwarmUiDialogs";
import { useScenarioActions } from "@/widgets/swarm-ui/useScenarioActions";
import { useRoleHandlers } from "@/widgets/swarm-ui/useRoleHandlers";
import { useProjectFormActions } from "@/widgets/swarm-ui/useProjectFormActions";
import { useArtifactsPanelState } from "@/widgets/swarm-ui/useArtifactsPanelState";
import { useScenarioGraphData } from "@/widgets/swarm-ui/useScenarioGraphData";
import { useSwarmUiDerived } from "@/widgets/swarm-ui/useSwarmUiDerived";
import { useSwarmUiHandlers } from "@/widgets/swarm-ui/useSwarmUiHandlers";

// Page navigation — injected from App.vue. "wiki-graph" is no longer a separate
// view — it renders inline as `WikiGraphPanel` between Pipeline and Events
// (see review-rules §10.6: surface inline, not hidden behind nav).
const _activeView = inject<Ref<"main" | "agent-editor" | "plugins">>(
  "activeView",
  ref("main"),
);
const activeView = computed(() => _activeView.value);
const toggleAgentEditor = inject<() => void>("toggleAgentEditor", () => {});
const setWorkspaceRoot = inject<(value: string) => void>("setWorkspaceRoot", () => {});

const projectsStore = useProjectsStore();
const ui = useUiStore();
const taskStore = useTaskStore();
const settings = useSettings();
const globalSettings = useGlobalSettings();
const settingsDrawerOpen = ref(false);
const preferences = usePreferencesStore();

const artifactsState = useArtifactsPanelState();
const dialogs = useSwarmUiDialogs(settings);

const {
  isRunning,
  currentPipelineSteps,
  sendWsSubscribe,
  syncTaskFromServer,
  onStartRun,
  onStopRun,
  onHumanResume,
  onConfirmShell,
  onConfirmManualShell,
  onRetry,
  onContinuePipeline,
} = useSwarmRunController(settings);

useSettingsHotReload({
  intervalMs: 7000,
  enabled: () =>
    !settings.isBooting.value &&
    !isRunning.value &&
    (typeof document === "undefined" || document.visibilityState === "visible"),
  fetcher: async () => {
    await settings.reloadProjectFile();
  },
});

const currentProjectName = computed(() => {
  const pdata = projectsStore.data;
  if (!pdata) return "";
  return pdata.projects[pdata.current]?.name || pdata.current;
});

const taskHistory = computed(() => ui.taskHistory.slice().reverse());

const scenarioReadiness = useScenarioRunReadiness(
  computed(() => settings.form.scenario_id),
  computed(() => ({
    prompt: settings.form.prompt,
    workspace_root: settings.form.workspace_root,
    project_context_file: settings.form.project_context_file,
    workspace_write: settings.form.workspace_write,
  })),
);

const {
  profileOptions,
  skillsCatalogIds,
  mediaForm,
  visualProbeManifest,
  researchSourcesText,
  codeReviewFindingsText,
  backgroundAgentRemoteConfig,
} = useSwarmUiDerived(settings);

const {
  effectivePipelineSteps,
  failedStepForGraph,
  activeStepForGraph,
  retryingStepsForGraph,
  blockedStepForGraph,
  completedStepsFromHistory,
  clarifyCacheProvenance,
  workspaceIdentityResolved,
  isCustomScenario,
  activeScenario,
} = usePipelineGraphState(settings, ui);

const {
  scenarioPreview,
  scenarioPreviewTitle,
  scenarioGraphWorkspaceWrite,
  scenarioGraphGates,
  scenarioGraphTools,
  scenarioGraphWarningTools,
} = useScenarioGraphData(
  settings,
  isCustomScenario,
  activeScenario,
  effectivePipelineSteps,
);

const scenarioActions = useScenarioActions(settings, activeScenario);
const roleHandlers = useRoleHandlers(settings);

const projectForm = useProjectFormActions(settings, {
  syncTaskFromServer,
  sendWsSubscribe,
});

const firstRunScenarioPanelVisible = computed(
  () =>
    scenarioActions.firstRunScenarioVisible.value &&
    !settings.form.scenario_id &&
    !settings.form.custom_scenario_id,
);

const {
  onResetRecommendedSteps,
  onProfileUpdate,
  onPromptUpdate,
  onAppendToPrompt,
  onHumanManualReviewUpdate,
  onEventsViewMode,
  onClearHistory,
  onUseHistoryAsContext,
  onCloseLoadedTask,
  onViewHistoryRun,
} = useSwarmUiHandlers(settings, { syncTaskFromServer, sendWsSubscribe });

watch(
  () => settings.form.workspace_root,
  (workspaceRoot) => {
    setWorkspaceRoot(workspaceRoot);
  },
  { immediate: true },
);

onMounted(async () => {
  void globalSettings.loadFromBackend();
  await settings.init();

  ui.loadEventsView(projectsStore.currentId);
  ui.loadHistory(projectsStore.currentId);

  const tid = ui.restoreActiveTask(projectsStore.currentId);
  ui.taskId = tid;
  if (tid) {
    taskStore.setTaskId(tid);
    void syncTaskFromServer(tid);
  }

  window.addEventListener("beforeunload", settings.flushSave);
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", settings.flushSave);
});
</script>
