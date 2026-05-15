<template>
  <main class="content">
    <OnboardingWizard
      class="page-onboarding"
      :workspace-root="settings.form.workspace_root"
      :tavily-api-key="globalSettings.state.tavily_api_key"
      :exa-api-key="globalSettings.state.exa_api_key"
      :scrapingdog-api-key="globalSettings.state.scrapingdog_api_key"
      @model-assignments="(a) => emit('onboarding-model-assignments', a)"
    />

    <StatusLine />

    <FirstRunScenarioPanel
      :visible="firstRunScenarioPanelVisible"
      @pick="(scenarioId) => emit('first-run-scenario-pick', scenarioId)"
      @skip="emit('first-run-scenario-skip')"
    />

    <PipelineGraph
      :steps="effectivePipelineSteps"
      :topology="settings.form.swarm_topology"
      :active-step="activeStepForGraph"
      :completed-steps="completedStepsFromHistory"
      :failed-step="failedStepForGraph"
      :skipped-steps="[]"
      :retrying-steps="retryingStepsForGraph"
      :blocked-step="blockedStepForGraph"
      :task-status="ui.taskStatus ?? undefined"
      :host-metrics="ui.hostMetrics"
      :host-metrics-history="ui.hostMetricsHistory"
      :editor-steps="isCustomScenario ? settings.pipelineState.steps.value : undefined"
      :editor-options="settings.pipelineState.getOptions()"
      :scenario-id="settings.form.scenario_id ?? CUSTOM_SCENARIO_ID"
      :custom-scenarios="settings.form.custom_scenarios"
      :active-custom-scenario-id="settings.form.custom_scenario_id"
      :workspace-write="scenarioGraphWorkspaceWrite"
      :scenario-gates="scenarioGraphGates"
      :scenario-tools="scenarioGraphTools"
      :scenario-warning-tools="scenarioGraphWarningTools"
      :disabled="isRunning"
      @update:topology="(val) => emit('swarm-form-update', 'swarm_topology', val)"
      @editor:add="settings.pipelineState.addStep()"
      @editor:reset="settings.pipelineState.reset()"
      @editor:reset-recommended="emit('reset-recommended-steps')"
      @editor:remove="(idx) => settings.pipelineState.removeStep(idx)"
      @editor:change="(idx, val) => settings.pipelineState.updateStep(idx, val)"
      @editor:reorder="(o, n, c) => settings.pipelineState.reorder(o, n, c ?? 1)"
      @scenario:select="(scenarioId) => emit('scenario-chip-select', scenarioId)"
      @scenario:copy-to-custom="emit('copy-scenario-to-custom')"
      @scenario:select-custom="
        (scenarioId) => emit('select-custom-scenario', scenarioId)
      "
      @scenario:save-custom="emit('save-custom-scenario')"
    />

    <BackgroundRecommendations
      :enabled="globalSettings.state.swarm_background_agent"
      :workspace-root="settings.form.workspace_root"
      :watch-paths="globalSettings.state.swarm_background_watch_paths"
      :environment="globalSettings.state.swarm_background_agent_provider"
      :model="globalSettings.state.swarm_background_agent_model"
      :remote-api-provider="backgroundAgentRemoteConfig.provider"
      :remote-api-key="backgroundAgentRemoteConfig.apiKey"
      :remote-api-base-url="backgroundAgentRemoteConfig.baseUrl"
    />

    <WikiGraphPanel />

    <EventsFeed
      :events="taskHistory"
      :view-mode="ui.eventsViewMode"
      @update:view-mode="(m) => emit('events-view-mode', m)"
    />

    <StepTokensPanel v-if="ui.taskId" :task-id="ui.taskId" />

    <ArtifactsPanel
      :open="artifactsOpen"
      :artifact-path="ui.artifactPath"
      :clarify-cache-provenance="clarifyCacheProvenance"
      :workspace-identity-resolved="workspaceIdentityResolved"
      :visual-probe-manifest="visualProbeManifest"
      :task-id="ui.taskId"
      :task-scenario-id="ui.taskScenarioId"
      :task-status="ui.taskStatus"
      :research-sources-text="researchSourcesText"
      :code-review-findings-text="codeReviewFindingsText"
      @toggle="(event) => emit('artifacts-toggle', event)"
    />

    <HistoryPanel
      :history-list="ui.historyList"
      @clear="emit('clear-history')"
      @use-as-context="(id) => emit('use-history-as-context', id)"
      @view-run="(id) => emit('view-history-run', id)"
    />
  </main>
</template>

<script setup lang="ts">
import OnboardingWizard from "@/widgets/onboarding-wizard/OnboardingWizard.vue";
import FirstRunScenarioPanel from "@/widgets/onboarding-wizard/FirstRunScenarioPanel.vue";
import PipelineGraph from "@/widgets/pipeline-graph/PipelineGraph.vue";
import StatusLine from "@/widgets/status-line/StatusLine.vue";
import BackgroundRecommendations from "@/widgets/background-agent/BackgroundRecommendations.vue";
import WikiGraphPanel from "@/widgets/wiki-graph-panel/WikiGraphPanel.vue";
import EventsFeed from "@/widgets/task-panel/EventsFeed.vue";
import HistoryPanel from "@/widgets/task-panel/HistoryPanel.vue";
import StepTokensPanel from "@/features/pipeline/StepTokensPanel.vue";
import ArtifactsPanel from "@/widgets/task-panel/ArtifactsPanel.vue";
import { useUiStore } from "@/shared/store/ui";
import { CUSTOM_SCENARIO_ID } from "@/shared/lib/swarm-ui-constants";
import type { useSettings } from "@/widgets/settings/useSettings";
import type { useGlobalSettings } from "@/features/global-settings/useGlobalSettings";
import type { ModelAssignment } from "@/shared/model/onboarding-types";

type SettingsApi = ReturnType<typeof useSettings>;
type GlobalSettingsApi = ReturnType<typeof useGlobalSettings>;

interface EventRow {
  id?: string;
  agent?: string;
  message?: string;
  timestamp?: string;
  status?: string;
}

defineProps<{
  settings: SettingsApi;
  globalSettings: GlobalSettingsApi;
  firstRunScenarioPanelVisible: boolean;
  effectivePipelineSteps: string[];
  activeStepForGraph: string;
  completedStepsFromHistory: string[];
  failedStepForGraph: string | undefined;
  retryingStepsForGraph: string[];
  blockedStepForGraph: string | null;
  isCustomScenario: boolean;
  scenarioGraphWorkspaceWrite: boolean;
  scenarioGraphGates: string[];
  scenarioGraphTools: string[];
  scenarioGraphWarningTools: string[];
  isRunning: boolean;
  backgroundAgentRemoteConfig: { provider: string; apiKey: string; baseUrl: string };
  taskHistory: EventRow[];
  artifactsOpen: boolean;
  clarifyCacheProvenance: string;
  workspaceIdentityResolved: string;
  visualProbeManifest: Record<string, unknown> | null;
  researchSourcesText: string;
  codeReviewFindingsText: string;
}>();

const emit = defineEmits<{
  (e: "onboarding-model-assignments", assignments: ModelAssignment[]): void;
  (e: "first-run-scenario-pick", scenarioId: string): void;
  (e: "first-run-scenario-skip"): void;
  (e: "swarm-form-update", field: string, value: string): void;
  (e: "reset-recommended-steps"): void;
  (e: "scenario-chip-select", scenarioId: string): void;
  (e: "copy-scenario-to-custom"): void;
  (e: "select-custom-scenario", scenarioId: string): void;
  (e: "save-custom-scenario"): void;
  (e: "events-view-mode", mode: "preview" | "raw"): void;
  (e: "artifacts-toggle", event: Event): void;
  (e: "clear-history"): void;
  (e: "use-history-as-context", id: string): void;
  (e: "view-history-run", id: string): void;
}>();

const ui = useUiStore();
</script>

<style scoped>
.page-onboarding {
  display: block;
  margin: 0 0 12px;
  width: 100%;
}
</style>
