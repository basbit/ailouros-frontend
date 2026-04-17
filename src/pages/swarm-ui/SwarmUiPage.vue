<template>
  <div
    class="swarm-vue-host"
    :class="{ 'swarm-vue-host--sidebar-collapsed': preferences.sidebarCollapsed }"
  >
    <!-- ── Header ──────────────────────────────────────────── -->
    <AppHeader
      :task-id="ui.taskId"
      :is-running="isRunning"
      :project-name="currentProjectName"
      :agent-editor-active="activeView === 'agent-editor'"
      @toggle-agent-editor="toggleAgentEditor()"
    />

    <div class="app-body">
      <!-- ── Sidebar ─────────────────────────────────────────── -->
      <aside class="sidebar">
        <div class="sidebar-scroll">
          <!-- Global settings: internet search API keys (cross-project) -->
          <GlobalSettingsPanel />

          <!-- Remote API profiles -->
          <RemoteApiProfiles
            :profiles="settings.profilesState.profiles.value"
            @add="settings.profilesState.addProfile()"
            @remove="(idx) => settings.profilesState.removeProfile(idx)"
            @update="
              (idx, field, val) => {
                settings.profilesState.updateProfile(idx, field, val);
                settings.rolesState.refreshAllProfileSelects();
              }
            "
          />

          <!-- Global web search API keys -->
          <GlobalSearchKeys
            :tavily-api-key="settings.form.swarm_tavily_api_key"
            :exa-api-key="settings.form.swarm_exa_api_key"
            :scrapingdog-api-key="settings.form.swarm_scrapingdog_api_key"
            @update:tavily-api-key="
              (value) => {
                settings.form.swarm_tavily_api_key = value;
                settings.saveSettingsSoon();
              }
            "
            @update:exa-api-key="
              (value) => {
                settings.form.swarm_exa_api_key = value;
                settings.saveSettingsSoon();
              }
            "
            @update:scrapingdog-api-key="
              (value) => {
                settings.form.swarm_scrapingdog_api_key = value;
                settings.saveSettingsSoon();
              }
            "
          />

          <!-- Project selector -->
          <ProjectSelect
            :current-id="projectsStore.currentId"
            :project-list="projectsStore.projectList"
            @change="onProjectChange"
            @new="onNewProject"
            @rename="onRenameProject"
            @delete="onDeleteProject"
          />

          <div class="section">
            <div class="section-title">{{ t("page.prompt") }}</div>
            <PromptInput
              :model-value="settings.form.prompt"
              :workspace-root="settings.form.workspace_root"
              :rows="5"
              :placeholder="t('prompt.placeholder')"
              @update:model-value="
                settings.form.prompt = $event;
                settings.saveSettingsSoon();
              "
            />

            <MemoryPanel
              @append-to-prompt="
                (text) => {
                  settings.form.prompt = settings.form.prompt
                    ? settings.form.prompt + '\n' + text
                    : text;
                  settings.saveSettingsSoon();
                }
              "
            />

            <div class="run-controls" style="margin-top: 10px">
              <div class="field">
                <label class="checkbox-row">
                  <input
                    id="human_manual_review"
                    type="checkbox"
                    :checked="settings.form.human_manual_review"
                    @change="
                      settings.form.human_manual_review = (
                        $event.target as HTMLInputElement
                      ).checked;
                      settings.saveSettingsSoon();
                    "
                  />
                  <span class="check-label">
                    {{ t("page.manualReview") }}
                  </span>
                </label>
              </div>
              <button v-if="!isRunning" class="start-btn" @click="onStartRun">
                &#9654; {{ t("page.start") }}
              </button>
              <button v-else class="stop-btn" @click="onStopRun">
                &#9646;&#9646; {{ t("page.stop") }}
              </button>
            </div>

            <HumanGate
              :visible="ui.humanGateVisible"
              :title="ui.humanGateTitle"
              :feedback="ui.humanGateFeedback"
              :task-id="ui.taskId ?? undefined"
              @update:feedback="ui.humanGateFeedback = $event"
              @submit="onHumanResume"
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
              :current-pipeline-steps="currentPipelineSteps"
              @retry="onRetry"
              @continue-pipeline="onContinuePipeline"
            />

            <div v-if="ui.taskError" class="task-error-banner">
              <strong>{{ t("status.error") }}:</strong> {{ ui.taskError }}
            </div>

            <div id="agentChips" class="agents">
              <div v-for="a in taskAgents" :key="a" class="chip">{{ a }}</div>
            </div>
          </div>

          <WorkspaceSettings
            :workspace-root="settings.form.workspace_root"
            :project-context-file="settings.form.project_context_file"
            :workspace-write="settings.form.workspace_write"
            :capabilities="ui.capabilities"
            @update:workspace-root="
              (v) => {
                settings.form.workspace_root = v;
                settings.saveSettingsSoon();
              }
            "
            @update:project-context-file="
              (v) => {
                settings.form.project_context_file = v;
                settings.saveSettingsSoon();
              }
            "
            @update:workspace-write="
              (v) => {
                settings.form.workspace_write = v;
                settings.saveSettingsSoon();
              }
            "
          />

          <AgentRoles
            :role-states="settings.rolesState.roleStates"
            :profile-options="profileOptions"
            :workspace-root="settings.form.workspace_root"
            :on-auto-assign="onAutoAssignModels"
            @env-change="onRoleEnvChange"
            @profile-change="onRoleProfileChange"
            @model-sel-change="onRoleModelSelChange"
            @model-custom-input="onRoleModelCustomInput"
            @prompt-sel-change="onRolePromptSelChange"
            @prompt-custom-input="onRolePromptCustomInput"
            @skill-ids-input="onRoleSkillIdsInput"
          >
            <template #dev-roles>
              <DevRoles
                :dev-roles="settings.devRolesState.devRoles.value"
                :ui-states="settings.devRolesState.uiStates"
                @add="settings.devRolesState.add()"
                @remove="(idx) => settings.devRolesState.remove(idx)"
                @update="
                  (idx, field, val) => settings.devRolesState.update(idx, field, val)
                "
              />
            </template>
            <template #skills-catalog>
              <SkillsCatalog
                :skills="settings.skillsState.skills.value"
                @add="settings.skillsState.add()"
                @remove="(idx) => settings.skillsState.remove(idx)"
                @update="
                  (idx, field, val) => settings.skillsState.update(idx, field, val)
                "
              />
            </template>
            <template #custom-roles>
              <CustomRoles
                :custom-roles="settings.customRolesState.customRoles.value"
                @add="settings.customRolesState.add()"
                @remove="(idx) => settings.customRolesState.remove(idx)"
                @update="
                  (idx, field, val) => settings.customRolesState.update(idx, field, val)
                "
              />
            </template>
          </AgentRoles>

          <SwarmSettings :form="settings.form" @update:form="onSwarmFormUpdate" />
        </div>
      </aside>

      <main class="content">
        <OnboardingWizard
          :workspace-root="settings.form.workspace_root"
          :tavily-api-key="globalSettings.state.tavily_api_key"
          :exa-api-key="globalSettings.state.exa_api_key"
          :scrapingdog-api-key="globalSettings.state.scrapingdog_api_key"
          @model-assignments="onOnboardingModelAssignments"
        />

        <StatusLine />

        <PipelineGraph
          :steps="effectivePipelineSteps"
          :topology="settings.form.swarm_topology"
          :active-step="activeStepForGraph"
          :completed-steps="completedStepsFromHistory"
          :failed-step="failedStepForGraph"
          :skipped-steps="[]"
          :task-status="ui.taskStatus ?? undefined"
          :host-metrics="ui.hostMetrics"
          :editor-steps="settings.pipelineState.steps.value"
          :editor-options="settings.pipelineState.getOptions()"
          @update:topology="(val) => onSwarmFormUpdate('swarm_topology', val)"
          @editor:add="settings.pipelineState.addStep()"
          @editor:reset="settings.pipelineState.reset()"
          @editor:reset-recommended="onResetRecommendedSteps"
          @editor:remove="(idx) => settings.pipelineState.removeStep(idx)"
          @editor:change="(idx, val) => settings.pipelineState.updateStep(idx, val)"
          @editor:reorder="(o, n, c) => settings.pipelineState.reorder(o, n, c ?? 1)"
        />

        <BackgroundRecommendations
          :enabled="settings.form.swarm_background_agent"
          :workspace-root="settings.form.workspace_root"
          :watch-paths="settings.form.swarm_background_watch_paths"
          :environment="settings.form.swarm_background_agent_provider"
          :model="settings.form.swarm_background_agent_model"
          :remote-api-provider="backgroundAgentRemoteConfig.provider"
          :remote-api-key="backgroundAgentRemoteConfig.apiKey"
          :remote-api-base-url="backgroundAgentRemoteConfig.baseUrl"
        />

        <WikiGraphPanel />

        <EventsFeed
          :events="taskHistory"
          :view-mode="ui.eventsViewMode"
          @update:view-mode="
            (m) => {
              ui.eventsViewMode = m;
              ui.saveEventsView(projectsStore.currentId);
            }
          "
        />

        <StepTokensPanel v-if="ui.taskId" :task-id="ui.taskId" />

        <div class="panel panel--artifacts content-panel--artifacts">
          <div class="panel-header">
            <span class="panel-title">{{ t("page.artifacts") }}</span>
          </div>
          <div class="panel-body">
            <a
              v-if="ui.artifactPath"
              :href="ui.artifactPath"
              target="_blank"
              rel="noreferrer"
            >
              {{ ui.artifactPath }}
            </a>
            <span v-else>—</span>
            <div class="hint" style="margin-top: 8px">
              {{ t("page.runLogHint") }}
            </div>
            <div v-if="clarifyCacheProvenance" class="hint" style="margin-top: 10px">
              <strong>{{ t("page.clarifyCache") }}:</strong>
              {{ clarifyCacheProvenance }}
            </div>
            <div
              v-if="workspaceIdentityResolved"
              class="hint"
              style="margin-top: 6px; word-break: break-all"
            >
              <strong>{{ t("page.workspaceIdentity") }}:</strong>
              {{ workspaceIdentityResolved }}
            </div>
          </div>
        </div>

        <HistoryPanel
          :history-list="ui.historyList"
          @clear="onClearHistory"
          @use-as-context="onUseHistoryAsContext"
          @view-run="onViewHistoryRun"
        />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from "vue";
import type { Ref } from "vue";
import { useProjectsStore } from "@/shared/store/projects";
import type { RoleSnapshot } from "@/shared/store/projects";
import type { ModelAssignment } from "@/features/onboarding/onboarding-types";
import { useUiStore } from "@/shared/store/ui";
import { useTaskStore } from "@/shared/store/task";
import { useSettings } from "@/features/project-settings/useSettings";
import { useSwarmRunController } from "@/features/swarm-run/useSwarmRunController";
import { recommendedStepsForTopology } from "@/features/pipeline/topologyPresets";

import AppHeader from "@/widgets/header/AppHeader.vue";
import PipelineGraph from "@/widgets/pipeline-graph/PipelineGraph.vue";
import StatusLine from "@/widgets/status-line/StatusLine.vue";
import EventsFeed from "@/widgets/task-panel/EventsFeed.vue";
import HistoryPanel from "@/widgets/task-panel/HistoryPanel.vue";
import GlobalSettingsPanel from "@/features/global-settings/GlobalSettingsPanel.vue";
import RemoteApiProfiles from "@/features/remote-api/RemoteApiProfiles.vue";
import ProjectSelect from "@/features/project-settings/ProjectSelect.vue";
import WorkspaceSettings from "@/features/workspace/WorkspaceSettings.vue";
import AgentRoles from "@/features/agent-roles/AgentRoles.vue";
import DevRoles from "@/features/dev-roles/DevRoles.vue";
import SkillsCatalog from "@/features/skills-catalog/SkillsCatalog.vue";
import CustomRoles from "@/features/custom-roles/CustomRoles.vue";
import SwarmSettings from "@/features/swarm-settings/SwarmSettings.vue";
import GlobalSearchKeys from "@/features/swarm-settings/GlobalSearchKeys.vue";
import HumanGate from "@/features/task-gate/HumanGate.vue";
import PromptInput from "@/features/prompt-input/PromptInput.vue";
import ShellGate from "@/features/task-gate/ShellGate.vue";
import ManualShellGate from "@/features/task-gate/ManualShellGate.vue";
import RetryGate from "@/features/task-gate/RetryGate.vue";
import OnboardingWizard from "@/features/onboarding/OnboardingWizard.vue";
import MemoryPanel from "@/features/memory-panel/MemoryPanel.vue";
import BackgroundRecommendations from "@/widgets/background-agent/BackgroundRecommendations.vue";
import WikiGraphPanel from "@/widgets/wiki-graph-panel/WikiGraphPanel.vue";
import StepTokensPanel from "@/features/pipeline/StepTokensPanel.vue";
import { usePreferencesStore } from "@/shared/store/preferences";
import { useUxStore } from "@/shared/store/ux";
import { useI18n } from "@/shared/lib/i18n";
import { useGlobalSettings } from "@/features/global-settings/useGlobalSettings";

// Page navigation — injected from App.vue. "wiki-graph" is no longer a
// separate view — it renders inline as `WikiGraphPanel` between Pipeline
// and Events (see review-rules §10.6: surface inline, not hidden behind nav).
const _activeView = inject<Ref<"main" | "agent-editor">>("activeView", ref("main"));
const activeView = computed(() => _activeView.value);
const toggleAgentEditor = inject<() => void>("toggleAgentEditor", () => {});
const setWorkspaceRoot = inject<(value: string) => void>("setWorkspaceRoot", () => {});

const projectsStore = useProjectsStore();
const ui = useUiStore();
const taskStore = useTaskStore();
const settings = useSettings();

// Effective remote connection for the background agent. Prefer the global
// connection fields; otherwise inherit the first stored profile that has a key.
// Keeping provider/base_url aligned with the selected key avoids sending an
// OpenAI-compatible key into the Anthropic SDK path.
const backgroundAgentRemoteConfig = computed(() => {
  const globalProvider = settings.form.remote_api_provider?.trim() ?? "";
  const globalKey = settings.form.remote_api_key?.trim() ?? "";
  const globalBaseUrl = settings.form.remote_api_base_url?.trim() ?? "";
  if (globalKey || globalBaseUrl) {
    return {
      provider: globalProvider,
      apiKey: globalKey,
      baseUrl: globalBaseUrl,
    };
  }
  for (const row of settings.profilesState.profiles.value ?? []) {
    const apiKey = row.api_key?.trim() ?? "";
    if (!apiKey) continue;
    return {
      provider: row.provider?.trim() ?? "",
      apiKey,
      baseUrl: row.base_url?.trim() ?? "",
    };
  }
  return {
    provider: globalProvider,
    apiKey: "",
    baseUrl: globalBaseUrl,
  };
});
const preferences = usePreferencesStore();
const ux = useUxStore();
const { t } = useI18n();

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

const currentProjectName = computed(() => {
  const pdata = projectsStore.data;
  if (!pdata) return "";
  return pdata.projects[pdata.current]?.name || pdata.current;
});

const taskHistory = computed(() => ui.taskHistory.slice().reverse());

const taskAgents = computed(() => ui.taskAgents);

const profileOptions = computed(() =>
  settings.profilesState.profiles.value
    .filter((p) => p.id.trim())
    .map((p) => ({ value: p.id, label: `${p.id} (${p.provider})` })),
);

const PIPELINE_STEP_ID_ALIASES: Record<string, string> = {
  arch: "architect",
  stack_review: "review_stack",
  pm_tasks: "dev_lead",
  review_pm_tasks: "review_dev_lead",
  human_pm_tasks: "human_dev_lead",
};

function normalizePipelineStepId(value: unknown): string {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return PIPELINE_STEP_ID_ALIASES[raw] ?? raw;
}

function isNonTerminalHistoryMessage(stepId: string, message: unknown): boolean {
  const text = String(message ?? "")
    .trim()
    .toLowerCase();
  if (!text) return true;
  return text === `${stepId} started` || text === "continuing after shell-gate";
}

function sameStepSequence(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every(
      (stepId, index) =>
        normalizePipelineStepId(stepId) === normalizePipelineStepId(right[index]),
    )
  );
}

function normalizedStepIndex(
  steps: string[],
  stepId: string | null | undefined,
): number {
  const target = normalizePipelineStepId(stepId);
  if (!target) return -1;
  return steps.findIndex((candidate) => normalizePipelineStepId(candidate) === target);
}

const configuredPipelineSteps = computed(() => settings.pipelineState.collectStepIds());

const runPipelineSteps = computed(() => {
  const fromPlan = ui.taskPipelinePlan?.pipeline_steps ?? [];
  if (fromPlan.length) return fromPlan;
  const tid = (ui.taskId ?? "").trim();
  if (!tid) return [];
  const historyEntry = ui.historyList.find(
    (entry) => (entry.taskId ?? "").trim() === tid,
  );
  return historyEntry?.pipeline_steps ?? [];
});

const effectivePipelineSteps = computed(() => {
  // Show run steps when a task is loaded (running, failed, or completed)
  if (runPipelineSteps.value.length) return runPipelineSteps.value;
  return configuredPipelineSteps.value;
});

const graphShowsLastRunState = computed(() => {
  if (!runPipelineSteps.value.length) return false;
  return sameStepSequence(runPipelineSteps.value, effectivePipelineSteps.value);
});

const failedStepForGraph = computed(() => {
  if (!graphShowsLastRunState.value) return undefined;
  const planFailed = normalizePipelineStepId(ui.taskPipelinePlan?.failed_step);
  if (planFailed) return planFailed;
  const retryFailed = normalizePipelineStepId(ui.retryFailedStep);
  return retryFailed && retryFailed !== "(unknown)" ? retryFailed : undefined;
});

const activeStepForGraph = computed(() => normalizePipelineStepId(ui.activeStep));

const completedStepsFromHistory = computed((): string[] => {
  const steps = effectivePipelineSteps.value;
  const active = activeStepForGraph.value || null;
  const failed = failedStepForGraph.value ?? null;
  if (!steps.length) return [];
  if (ui.taskStatus === "completed" && graphShowsLastRunState.value) return [...steps];

  const completed = new Set<string>();
  const visibleStepIds = new Set(
    steps.map((stepId) => normalizePipelineStepId(stepId)),
  );

  if (failed) {
    const idx = normalizedStepIndex(steps, failed);
    if (idx > 0) {
      steps
        .slice(0, idx)
        .forEach((stepId) => completed.add(normalizePipelineStepId(stepId)));
    }
  }
  if (active) {
    const idx = normalizedStepIndex(steps, active);
    if (idx > 0) {
      steps
        .slice(0, idx)
        .forEach((stepId) => completed.add(normalizePipelineStepId(stepId)));
    }
  }

  for (const event of ui.taskHistory) {
    const stepId = normalizePipelineStepId(event.agent);
    if (!stepId || !visibleStepIds.has(stepId)) continue;
    if (stepId === active || stepId === failed) continue;
    if (isNonTerminalHistoryMessage(stepId, event.message)) continue;
    completed.add(stepId);
  }

  const snapshotLike = [
    ui.taskPipelinePlan as Record<string, unknown> | null,
    (ui.taskPipelinePlan?.partial_state as Record<string, unknown> | undefined) ?? null,
  ];
  for (const snapshot of snapshotLike) {
    if (!snapshot) continue;
    for (const stepId of visibleStepIds) {
      const outputKey = `${stepId}_output`;
      const value = snapshot[outputKey];
      if (typeof value === "string" && value.trim()) {
        completed.add(stepId);
      }
    }
  }

  return steps.filter((stepId) => completed.has(normalizePipelineStepId(stepId)));
});

const clarifyCacheProvenance = computed(() => {
  const plan = ui.taskPipelinePlan;
  const partial = (plan?.partial_state ?? {}) as Record<string, unknown>;
  const cache =
    (partial.clarify_input_cache as Record<string, unknown> | undefined) ??
    ((plan as Record<string, unknown> | null)?.clarify_input_cache as
      | Record<string, unknown>
      | undefined);
  if (!cache) return "";
  const hit = cache.hit === true ? "hit" : "miss";
  const reason =
    typeof cache.reuse_blocked_reason === "string" && cache.reuse_blocked_reason
      ? `, ${cache.reuse_blocked_reason}`
      : "";
  const key =
    typeof cache.cache_key === "string" && cache.cache_key
      ? `, key=${cache.cache_key}`
      : "";
  return `${hit}${reason}${key}`;
});

const workspaceIdentityResolved = computed(() => {
  const plan = ui.taskPipelinePlan;
  const partial = (plan?.partial_state ?? {}) as Record<string, unknown>;
  const identity = partial.workspace_identity as Record<string, unknown> | undefined;
  if (identity && typeof identity.workspace_root_resolved === "string") {
    return identity.workspace_root_resolved;
  }
  const workspace = (plan as Record<string, unknown> | null)?.workspace as
    | Record<string, unknown>
    | undefined;
  if (workspace && typeof workspace.workspace_root_resolved === "string") {
    return workspace.workspace_root_resolved;
  }
  return "";
});

watch(
  () => settings.form.workspace_root,
  (workspaceRoot) => {
    setWorkspaceRoot(workspaceRoot);
  },
  { immediate: true },
);

async function onProjectChange(id: string): Promise<void> {
  if (id === projectsStore.currentId) return;
  await settings.switchProject(id);
  refreshProjectPanels();
}

async function onNewProject(): Promise<void> {
  const name = (
    (await ux.promptDialog({
      title: t("dialogs.project.new.title"),
      message: t("dialogs.project.new.message"),
      value: t("page.newProjectDefault"),
    })) ?? ""
  ).trim();
  if (!name) return;
  await settings.newProject(name);
  refreshProjectPanels();
}

async function onRenameProject(): Promise<void> {
  const pdata = projectsStore.data;
  if (!pdata) return;
  const cur = pdata.current;
  const p = pdata.projects[cur];
  const name = (
    (await ux.promptDialog({
      title: t("dialogs.project.rename.title"),
      message: t("dialogs.project.rename.message"),
      value: p?.name || cur,
    })) ?? ""
  ).trim();
  if (!name) return;
  projectsStore.renameProject(cur, name);
}

async function onDeleteProject(): Promise<void> {
  const pdata = projectsStore.data;
  if (!pdata) return;
  const ids = Object.keys(pdata.projects);
  if (ids.length <= 1) {
    await ux.alertDialog({
      title: t("dialogs.project.last.title"),
      message: t("dialogs.project.last.message"),
    });
    return;
  }
  const cur = pdata.current;
  const label = pdata.projects[cur]?.name || cur;
  const confirmed = await ux.confirmDialog({
    title: t("dialogs.project.delete.title"),
    message: `${t("dialogs.project.delete.message")}\n\n${label}`,
  });
  if (!confirmed) return;
  await settings.deleteCurrentProject();
  refreshProjectPanels();
}

function refreshProjectPanels(): void {
  ui.loadEventsView(projectsStore.currentId);
  ui.loadHistory(projectsStore.currentId);
  ui.resetTaskView();
  const tid = ui.restoreActiveTask(projectsStore.currentId);
  ui.taskId = tid;
  taskStore.resetTask();
  if (tid) {
    taskStore.setTaskId(tid);
    void syncTaskFromServer(tid);
  }
  sendWsSubscribe();
}

async function onRoleEnvChange(roleId: string, env: string): Promise<void> {
  settings.rolesState.roleStates[roleId].environment = env;
  settings.rolesState.roleStates[roleId].showProfileSelect = env === "cloud";
  await settings.rolesState.onEnvChange(roleId);
}

async function onRoleProfileChange(roleId: string, profile: string): Promise<void> {
  settings.rolesState.roleStates[roleId].remoteProfile = profile;
  await settings.rolesState.onRemoteProfilePick(roleId);
}

function onRoleModelSelChange(roleId: string, val: string): void {
  settings.rolesState.roleStates[roleId].modelSel = val;
  settings.rolesState.onModelSelect(roleId);
}

function onRoleModelCustomInput(roleId: string, val: string): void {
  settings.rolesState.roleStates[roleId].modelCustom = val;
  settings.saveSettingsSoon();
}

function onRolePromptSelChange(roleId: string, val: string): void {
  settings.rolesState.roleStates[roleId].promptSel = val;
  settings.rolesState.onPromptSelect(roleId);
}

function onRolePromptCustomInput(roleId: string, val: string): void {
  settings.rolesState.roleStates[roleId].promptCustom = val;
  settings.saveSettingsSoon();
}

function onRoleSkillIdsInput(roleId: string, val: string): void {
  settings.rolesState.roleStates[roleId].skillIds = val;
  settings.saveSettingsSoon();
}

function onResetRecommendedSteps(): void {
  const ids = recommendedStepsForTopology(settings.form.swarm_topology);
  settings.pipelineState.applyStepIds(ids);
}

function onOnboardingModelAssignments(assignments: ModelAssignment[]): void {
  const snap: Record<string, RoleSnapshot> = {};
  for (const a of assignments) {
    const env =
      a.provider === "ollama"
        ? "ollama"
        : a.provider === "lm_studio"
          ? "lmstudio"
          : "cloud";
    const existing = settings.rolesState.roleStates[a.role];
    snap[a.role] = {
      environment: env,
      model: a.model_id,
      // keep existing prompt/profile so we only override model+env
      prompt_path: existing ? settings.rolesState.effectivePromptPath(a.role) : "",
      remote_profile: existing?.remoteProfile || undefined,
    };
  }
  void settings.rolesState.applyRolesSnap(snap);
  settings.saveSettingsSoon();
}

async function onAutoAssignModels(): Promise<void> {
  const err = await settings.rolesState.applyAssignments(settings.form.workspace_root);
  if (err) {
    ui.taskError = `${t("toast.autoModelAssignmentFailed")}: ${err}`;
  }
}

type SwarmFormKey = keyof typeof settings.form;

function onSwarmFormUpdate(field: string, value: string): void {
  const k = field as SwarmFormKey;
  const f = settings.form;
  if (typeof f[k] === "boolean") {
    (f as Record<string, unknown>)[k] = value === "true";
  } else {
    (f as Record<string, unknown>)[k] = value;
  }
  settings.saveSettingsSoon();
}

async function onClearHistory(): Promise<void> {
  const confirmed = await ux.confirmDialog({
    title: t("dialogs.history.clear.title"),
    message: t("dialogs.history.clear.message"),
  });
  if (!confirmed) return;
  ui.clearHistory(projectsStore.currentId);
}

function onUseHistoryAsContext(id: string): void {
  const h = ui.historyList.find((x) => x.id === id);
  if (!h) return;
  const block = (h.prompt ?? "").trim();
  if (!block) return;
  const cur = settings.form.prompt.trim();
  settings.form.prompt = cur ? block + "\n\n---\n\n" + cur : block;
  if (h.workspace_root !== undefined)
    settings.form.workspace_root = h.workspace_root ?? "";
  if (h.project_context_file !== undefined)
    settings.form.project_context_file = h.project_context_file ?? "";
  if (h.workspace_write !== undefined)
    settings.form.workspace_write = h.workspace_write ?? false;
  settings.saveSettingsSoon();
}

async function onViewHistoryRun(id: string): Promise<void> {
  const entry = ui.historyList.find((x) => x.id === id);
  const tid = entry?.taskId?.trim();
  if (!tid) {
    await ux.alertDialog({
      title: t("dialogs.history.noTask.title"),
      message: t("dialogs.history.noTask.message"),
    });
    return;
  }
  ui.taskId = tid;
  ui.persistActiveTask(tid, projectsStore.currentId);
  taskStore.setTaskId(tid);
  await syncTaskFromServer(tid);
  sendWsSubscribe();
}

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

<style scoped>
.task-error-banner {
  background: color-mix(in srgb, var(--error, #d7563f) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--error, #d7563f) 40%, transparent);
  border-radius: 10px;
  padding: 10px 12px;
  margin: 8px 0;
  color: var(--text, #f5f0e7);
  font-size: 0.875rem;
  word-break: break-word;
}
</style>
