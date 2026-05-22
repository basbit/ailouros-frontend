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
      @open-settings="settingsDrawerOpen = true"
      @close-task="onCloseLoadedTask"
      @project-change="projectForm.onProjectChange"
      @project-new="projectForm.onNewProject"
      @project-rename="projectForm.onRenameProjectById"
      @project-delete="projectForm.onDeleteProjectById"
      @project-edit="projectForm.onEditProjectById"
    />

    <SwarmUiModalsPanel
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
      @sudo-prompt-confirm="dialogs.onSudoPromptConfirm"
      @sudo-prompt-cancel="dialogs.sudoPromptOpen.value = false"
    />

    <div class="app-body">
      <aside class="sidebar">
        <div class="sidebar-scroll">
          <SwarmUiSidebarPromptPanel
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

          <SwarmUiSidebarRolesPanel
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
            @role-prompt-text-input="roleHandlers.onRolePromptTextInput"
            @role-skill-ids-input="roleHandlers.onRoleSkillIdsInput"
            @swarm-form-update="roleHandlers.onSwarmFormUpdate"
          />
        </div>
      </aside>

      <SwarmUiMainPanel
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
        @open-local-models="settingsDrawerOpen = true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from "vue";
import { useProjectsStore } from "@/shared/store/projects";
import { useUiStore } from "@/shared/store/ui";
import { usePreferencesStore } from "@/shared/store/preferences";
import { APP_SETTINGS_KEY } from "@/entities/app-settings/contract";
import { SWARM_RUN_CONTROLLER_KEY } from "@/features/swarm-run/swarmRunContext";
import { GLOBAL_SETTINGS_KEY } from "@/features/global-settings/globalSettingsContext";
import { useInjectedProjectFormActions } from "@/entities/project-form";
import { usePipelineGraphState } from "@/pages/swarm-ui/usePipelineGraphState";

import AppHeader from "@/widgets/header/AppHeader.vue";
import { FirstRunGate } from "@/features/onboarding-desktop";
import SwarmUiModalsPanel from "@/pages/swarm-ui/SwarmUiModalsPanel.vue";
import SwarmUiSidebarPromptPanel from "@/pages/swarm-ui/SwarmUiSidebarPromptPanel.vue";
import SwarmUiSidebarRolesPanel from "@/pages/swarm-ui/SwarmUiSidebarRolesPanel.vue";
import SwarmUiMainPanel from "@/pages/swarm-ui/SwarmUiMainPanel.vue";
import { useScenarioRunReadiness } from "@/features/scenario-picker";
import { useSwarmUiDialogs } from "@/pages/swarm-ui/useSwarmUiDialogs";
import { useScenarioActions } from "@/pages/swarm-ui/useScenarioActions";
import { useRoleHandlers } from "@/pages/swarm-ui/useRoleHandlers";
import { useArtifactsPanelState } from "@/pages/swarm-ui/useArtifactsPanelState";
import { useScenarioGraphData } from "@/pages/swarm-ui/useScenarioGraphData";
import { useSwarmUiDerived } from "@/pages/swarm-ui/useSwarmUiDerived";
import { useSwarmUiHandlers } from "@/pages/swarm-ui/useSwarmUiHandlers";

const settings = inject(APP_SETTINGS_KEY);
const controller = inject(SWARM_RUN_CONTROLLER_KEY);
const globalSettings = inject(GLOBAL_SETTINGS_KEY);
if (!settings || !controller || !globalSettings) {
  throw new Error(
    "SwarmUiPage requires APP_SETTINGS_KEY, SWARM_RUN_CONTROLLER_KEY, GLOBAL_SETTINGS_KEY",
  );
}

const projectsStore = useProjectsStore();
const ui = useUiStore();
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
} = controller;

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

const projectForm = useInjectedProjectFormActions();

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
</script>
