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
      :current-project-id="projectsStore.currentId"
      :project-list="projectsStore.projectList"
      :agent-editor-active="activeView === 'agent-editor'"
      @toggle-agent-editor="toggleAgentEditor()"
      @open-settings="settingsDrawerOpen = true"
      @close-task="onCloseLoadedTask"
      @project-change="onProjectChange"
      @project-new="onNewProject"
      @project-rename="onRenameProjectById"
      @project-delete="onDeleteProjectById"
      @project-edit="onEditProjectById"
    />

    <ProjectFormDialog
      :open="projectFormOpen"
      :mode="projectFormMode"
      :initial="projectFormInitial"
      :capabilities="ui.capabilities"
      @update:open="projectFormOpen = $event"
      @submit="onProjectFormSubmit"
    />

    <!-- ── Global settings drawer (cross-project) ─────────── -->
    <SettingsDrawer
      :open="settingsDrawerOpen"
      @update:open="settingsDrawerOpen = $event"
    >
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
      <GlobalSettingsPanel
        :remote-api-provider="settings.form.remote_api_provider"
        :remote-api-key="settings.form.remote_api_key"
        :remote-api-base-url="settings.form.remote_api_base_url"
      />
    </SettingsDrawer>

    <div class="app-body">
      <!-- ── Sidebar ─────────────────────────────────────────── -->
      <aside class="sidebar">
        <div class="sidebar-scroll">
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
              <div class="field">
                <label class="checkbox-row">
                  <input
                    id="swarm_force_rerun"
                    type="checkbox"
                    :checked="settings.form.swarm_force_rerun"
                    @change="
                      onSwarmFormUpdate(
                        'swarm_force_rerun',
                        String(($event.target as HTMLInputElement).checked),
                      )
                    "
                  />
                  <span class="check-label">{{ t("auto.forceRerunLabel") }}</span>
                </label>
                <div class="hint">{{ t("auto.forceRerunHint") }}</div>
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

            <div v-if="ui.blockedReason" class="task-blocked-banner">
              <strong>{{ t("status.blocked") }}</strong>
              <span v-if="ui.blockedStep"> · {{ ui.blockedStep }}</span>
              <span v-if="ui.blockedCode"> [{{ ui.blockedCode }}]</span>
              <div class="task-blocked-reason">{{ ui.blockedReason }}</div>
            </div>

            <div id="agentChips" class="agents">
              <div
                v-for="a in taskAgents"
                :key="a"
                class="chip"
                :class="{ 'chip--failed': a === ui.retryFailedStep }"
              >
                {{ a }}
              </div>
            </div>
          </div>

          <AgentRoles
            :role-states="settings.rolesState.roleStates"
            :profile-options="profileOptions"
            :workspace-root="settings.form.workspace_root"
            :catalog-ids="skillsCatalogIds"
            :on-auto-assign="onAutoAssignModels"
            :media-form="mediaForm"
            @env-change="onRoleEnvChange"
            @profile-change="onRoleProfileChange"
            @model-sel-change="onRoleModelSelChange"
            @model-custom-input="onRoleModelCustomInput"
            @prompt-sel-change="onRolePromptSelChange"
            @prompt-custom-input="onRolePromptCustomInput"
            @skill-ids-input="onRoleSkillIdsInput"
            @media-update="onSwarmFormUpdate"
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
                :ui-states="settings.customRolesState.uiStates"
                :workspace-root="settings.form.workspace_root"
                :catalog-ids="skillsCatalogIds"
                @add="settings.customRolesState.add()"
                @remove="(idx) => settings.customRolesState.remove(idx)"
                @update="
                  (idx, field, val) => settings.customRolesState.update(idx, field, val)
                "
              />
            </template>
          </AgentRoles>
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
          :retrying-steps="retryingStepsForGraph"
          :blocked-step="blockedStepForGraph"
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
          @update:view-mode="
            (m) => {
              ui.eventsViewMode = m;
              ui.saveEventsView(projectsStore.currentId);
            }
          "
        />

        <StepTokensPanel v-if="ui.taskId" :task-id="ui.taskId" />

        <details
          class="panel panel--artifacts content-panel--artifacts"
          :open="artifactsOpen"
          @toggle="onArtifactsToggle"
        >
          <summary class="panel-header">
            <span class="panel-title">{{ t("page.artifacts") }}</span>
          </summary>
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
        </details>

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
import type { ModelAssignment } from "@/shared/model/onboarding-types";
import { useUiStore } from "@/shared/store/ui";
import { useTaskStore } from "@/shared/store/task";
import { useSettings } from "@/features/project-settings/useSettings";
import { useSwarmRunController } from "@/features/swarm-run/useSwarmRunController";
import { recommendedStepsForTopology } from "@/shared/lib/pipeline-topology";

import AppHeader from "@/widgets/header/AppHeader.vue";
import PipelineGraph from "@/widgets/pipeline-graph/PipelineGraph.vue";
import StatusLine from "@/widgets/status-line/StatusLine.vue";
import EventsFeed from "@/widgets/task-panel/EventsFeed.vue";
import HistoryPanel from "@/widgets/task-panel/HistoryPanel.vue";
import GlobalSettingsPanel from "@/features/global-settings/GlobalSettingsPanel.vue";
import RemoteApiProfiles from "@/features/remote-api/RemoteApiProfiles.vue";
import ProjectFormDialog, {
  type ProjectFormValues,
} from "@/features/project-settings/ProjectFormDialog.vue";
import AgentRoles from "@/features/agent-roles/AgentRoles.vue";
import DevRoles from "@/features/dev-roles/DevRoles.vue";
import SkillsCatalog from "@/features/skills-catalog/SkillsCatalog.vue";
import CustomRoles from "@/features/custom-roles/CustomRoles.vue";
import HumanGate from "@/features/task-gate/HumanGate.vue";
import PromptInput from "@/features/prompt-input/PromptInput.vue";
import ShellGate from "@/features/task-gate/ShellGate.vue";
import ManualShellGate from "@/features/task-gate/ManualShellGate.vue";
import RetryGate from "@/features/task-gate/RetryGate.vue";
import OnboardingWizard from "@/widgets/onboarding-wizard/OnboardingWizard.vue";
import MemoryPanel from "@/features/memory-panel/MemoryPanel.vue";
import BackgroundRecommendations from "@/widgets/background-agent/BackgroundRecommendations.vue";
import SettingsDrawer from "@/widgets/settings-drawer/SettingsDrawer.vue";
import WikiGraphPanel from "@/widgets/wiki-graph-panel/WikiGraphPanel.vue";
import StepTokensPanel from "@/features/pipeline/StepTokensPanel.vue";
import { usePreferencesStore } from "@/shared/store/preferences";
import { useUxStore } from "@/shared/store/ux";
import { useI18n } from "@/shared/lib/i18n";
import { useGlobalSettings } from "@/features/global-settings/useGlobalSettings";
import { usePipelineGraphState } from "@/pages/swarm-ui/usePipelineGraphState";

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
const globalSettings = useGlobalSettings();
const settingsDrawerOpen = ref(false);

const LS_ARTIFACTS_OPEN_KEY = "swarm.artifacts-panel-open";
const artifactsOpen = ref<boolean>(localStorage.getItem(LS_ARTIFACTS_OPEN_KEY) !== "0");
function onArtifactsToggle(event: Event): void {
  const target = event.target as HTMLDetailsElement;
  artifactsOpen.value = target.open;
  localStorage.setItem(LS_ARTIFACTS_OPEN_KEY, target.open ? "1" : "0");
}

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

const skillsCatalogIds = computed(() =>
  settings.skillsState.skills.value
    .map((s) => ({ id: (s.id ?? "").trim(), title: s.title ?? s.id }))
    .filter((s) => s.id),
);

const mediaForm = computed(() => ({
  media_enabled: settings.form.media_enabled,
  media_image_provider: settings.form.media_image_provider,
  media_image_model: settings.form.media_image_model,
  media_image_api_key: settings.form.media_image_api_key,
  media_audio_provider: settings.form.media_audio_provider,
  media_audio_model: settings.form.media_audio_model,
  media_audio_api_key: settings.form.media_audio_api_key,
  media_audio_voice: settings.form.media_audio_voice,
  media_budget_max_cost_usd: settings.form.media_budget_max_cost_usd,
  media_budget_max_attempts: settings.form.media_budget_max_attempts,
  media_license_policy: settings.form.media_license_policy,
}));

const {
  effectivePipelineSteps,
  failedStepForGraph,
  activeStepForGraph,
  retryingStepsForGraph,
  blockedStepForGraph,
  completedStepsFromHistory,
  clarifyCacheProvenance,
  workspaceIdentityResolved,
} = usePipelineGraphState(settings, ui);

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

// ── Project create/edit dialog ─────────────────────────────────────────
const projectFormOpen = ref(false);
const projectFormMode = ref<"create" | "edit">("create");
const projectFormEditingId = ref<string | null>(null);
const projectFormInitial = ref<Partial<ProjectFormValues>>({});

const ADVANCED_FORM_FIELDS = [
  "workspace_root",
  "project_context_file",
  "workspace_write",
  "swarm_languages",
  "swarm_doc_locale",
  "swarm_documentation_sources",
  "swarm_pattern_memory",
  "swarm_memory_namespace",
  "swarm_pattern_memory_path",
  "swarm_pipeline_hooks_module",
  "swarm_disable_tree_sitter",
  "swarm_mcp_auto",
  "swarm_skip_mcp_tools",
  "mcp_servers_json",
  "swarm_database_url",
  "swarm_database_hint",
  "swarm_database_readonly",
  "media_enabled",
  "media_image_provider",
  "media_image_model",
  "media_image_api_key",
  "media_audio_provider",
  "media_audio_model",
  "media_audio_api_key",
  "media_audio_voice",
  "media_budget_max_cost_usd",
  "media_budget_max_attempts",
  "media_license_policy",
] as const;

function buildFormInitial(snap: Record<string, unknown>): Partial<ProjectFormValues> {
  const out: Record<string, unknown> = {};
  for (const k of ADVANCED_FORM_FIELDS) {
    if (k in snap) out[k] = snap[k];
  }
  return out as Partial<ProjectFormValues>;
}

function onNewProject(): void {
  projectFormMode.value = "create";
  projectFormEditingId.value = null;
  projectFormInitial.value = {
    name: t("page.newProjectDefault"),
    workspace_root: "",
    project_context_file: "",
    workspace_write: false,
  };
  projectFormOpen.value = true;
}

function onEditProjectById(id: string): void {
  const snap = projectsStore.getSnap(id);
  const entry = projectsStore.data?.projects[id];
  if (!snap || !entry) return;
  projectFormMode.value = "edit";
  projectFormEditingId.value = id;
  projectFormInitial.value = {
    name: entry.name,
    ...buildFormInitial(snap as unknown as Record<string, unknown>),
  };
  projectFormOpen.value = true;
}

function applyAdvancedToForm(values: ProjectFormValues): void {
  for (const k of ADVANCED_FORM_FIELDS) {
    (settings.form as Record<string, unknown>)[k] = (
      values as unknown as Record<string, unknown>
    )[k];
  }
}

function advancedPatch(values: ProjectFormValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of ADVANCED_FORM_FIELDS) {
    out[k] = (values as unknown as Record<string, unknown>)[k];
  }
  return out;
}

async function onProjectFormSubmit(values: ProjectFormValues): Promise<void> {
  projectFormOpen.value = false;

  if (projectFormMode.value === "create") {
    await settings.newProject(values.name);
    // newProject makes the new one current — update its form + persist.
    applyAdvancedToForm(values);
    settings.saveSettingsSoon();
    refreshProjectPanels();
    return;
  }

  const id = projectFormEditingId.value;
  if (!id) return;
  projectsStore.renameProject(id, values.name);

  if (id === projectsStore.currentId) {
    applyAdvancedToForm(values);
    settings.saveSettingsSoon();
  } else {
    projectsStore.patchSnap(id, advancedPatch(values));
  }
}

async function onRenameProjectById(id: string): Promise<void> {
  const pdata = projectsStore.data;
  if (!pdata) return;
  const p = pdata.projects[id];
  const name = (
    (await ux.promptDialog({
      title: t("dialogs.project.rename.title"),
      message: t("dialogs.project.rename.message"),
      value: p?.name || id,
    })) ?? ""
  ).trim();
  if (!name) return;
  projectsStore.renameProject(id, name);
}

async function onDeleteProjectById(id: string): Promise<void> {
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
  const label = pdata.projects[id]?.name || id;
  const confirmed = await ux.confirmDialog({
    title: t("dialogs.project.delete.title"),
    message: `${t("dialogs.project.delete.message")}\n\n${label}`,
  });
  if (!confirmed) return;
  if (id === pdata.current) {
    await settings.deleteCurrentProject();
    refreshProjectPanels();
  } else {
    projectsStore.deleteProject(id);
  }
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

function onCloseLoadedTask(): void {
  // "Close" the currently loaded run: clear the events/status/artifact view,
  // drop the active task id from local persistence, and reset the task store.
  // This is a UI-side clear — it does not cancel a running task on the server
  // (the stop button handles that, and the X is only shown when !isRunning).
  ui.resetTaskView();
  ui.persistActiveTask(null, projectsStore.currentId);
  taskStore.resetTask();
  sendWsSubscribe();
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
.task-blocked-banner {
  background: color-mix(in srgb, #d7563f 10%, transparent);
  border: 1px solid color-mix(in srgb, #d7563f 45%, transparent);
  border-radius: 10px;
  padding: 10px 12px;
  margin: 8px 0;
  color: var(--text, #f5f0e7);
  font-size: 0.875rem;
  word-break: break-word;
}
.task-blocked-reason {
  margin-top: 4px;
  color: var(--text2, #c9c2b5);
}
</style>
