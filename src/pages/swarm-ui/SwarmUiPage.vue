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
    />

    <div class="app-body">
      <!-- ── Sidebar ─────────────────────────────────────────── -->
      <aside class="sidebar">
        <div class="sidebar-scroll">
          <!-- Remote API profiles (global) -->
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
              @confirm="onConfirmShell"
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
          @model-assignments="onOnboardingModelAssignments"
        />

        <StatusLine />

        <PipelineGraph
          :steps="effectivePipelineSteps"
          :topology="settings.form.swarm_topology"
          :active-step="ui.activeStep"
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
          @editor:remove="(idx) => settings.pipelineState.removeStep(idx)"
          @editor:change="(idx, val) => settings.pipelineState.updateStep(idx, val)"
          @editor:reorder="(o, n) => settings.pipelineState.reorder(o, n)"
        />

        <BackgroundRecommendations :enabled="settings.form.swarm_background_agent" />

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
import { computed, onMounted } from "vue";
import { useProjectsStore } from "@/shared/store/projects";
import type { RoleSnapshot } from "@/shared/store/projects";
import type { ModelAssignment } from "@/features/onboarding/onboarding-types";
import { useUiStore } from "@/shared/store/ui";
import { useTaskStore } from "@/shared/store/task";
import { useSettings } from "@/features/project-settings/useSettings";
import { useSwarmRunController } from "@/features/swarm-run/useSwarmRunController";

import AppHeader from "@/widgets/header/AppHeader.vue";
import PipelineGraph from "@/widgets/pipeline-graph/PipelineGraph.vue";
import StatusLine from "@/widgets/status-line/StatusLine.vue";
import EventsFeed from "@/widgets/task-panel/EventsFeed.vue";
import HistoryPanel from "@/widgets/task-panel/HistoryPanel.vue";
import RemoteApiProfiles from "@/features/remote-api/RemoteApiProfiles.vue";
import ProjectSelect from "@/features/project-settings/ProjectSelect.vue";
import WorkspaceSettings from "@/features/workspace/WorkspaceSettings.vue";
import AgentRoles from "@/features/agent-roles/AgentRoles.vue";
import DevRoles from "@/features/dev-roles/DevRoles.vue";
import SkillsCatalog from "@/features/skills-catalog/SkillsCatalog.vue";
import CustomRoles from "@/features/custom-roles/CustomRoles.vue";
import SwarmSettings from "@/features/swarm-settings/SwarmSettings.vue";
import HumanGate from "@/features/task-gate/HumanGate.vue";
import PromptInput from "@/features/prompt-input/PromptInput.vue";
import ShellGate from "@/features/task-gate/ShellGate.vue";
import RetryGate from "@/features/task-gate/RetryGate.vue";
import OnboardingWizard from "@/features/onboarding/OnboardingWizard.vue";
import MemoryPanel from "@/features/memory-panel/MemoryPanel.vue";
import BackgroundRecommendations from "@/widgets/background-agent/BackgroundRecommendations.vue";
import { usePreferencesStore } from "@/shared/store/preferences";
import { useUxStore } from "@/shared/store/ux";
import { useI18n } from "@/shared/lib/i18n";

const projectsStore = useProjectsStore();
const ui = useUiStore();
const taskStore = useTaskStore();
const settings = useSettings();
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

const effectivePipelineSteps = computed(() => {
  const fromPlan = ui.taskPipelinePlan?.pipeline_steps ?? [];
  if (fromPlan.length) return fromPlan;
  return settings.pipelineState.collectStepIds();
});

const failedStepForGraph = computed(() => {
  const planFailed = String(ui.taskPipelinePlan?.failed_step || "").trim();
  if (planFailed) return planFailed;
  return ui.retryFailedStep !== "(unknown)" ? ui.retryFailedStep : undefined;
});

const completedStepsFromHistory = computed(() => {
  const steps = effectivePipelineSteps.value;
  const active = ui.activeStep ?? null;
  const failed = failedStepForGraph.value ?? null;
  if (!steps.length) return [];
  if (ui.taskStatus === "completed") return [...steps];
  if (failed) {
    const idx = steps.indexOf(failed);
    return idx > 0 ? steps.slice(0, idx) : [];
  }
  if (active) {
    const idx = steps.indexOf(active);
    return idx > 0 ? steps.slice(0, idx) : [];
  }
  return [];
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
  ui.taskHistory = [];
  ui.humanGateVisible = false;
  ui.humanGateFeedback = "";
  ui.shellGateVisible = false;
  ui.retryGateVisible = false;
  const tid = ui.restoreActiveTask(projectsStore.currentId);
  ui.taskId = tid;
  ui.taskStatus = null;
  ui.taskError = null;
  ui.taskAgents = [];
  ui.artifactPath = null;
  ui.taskPipelinePlan = null;
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
  await settings.init();

  ui.loadEventsView(projectsStore.currentId);
  ui.loadHistory(projectsStore.currentId);

  const tid = ui.restoreActiveTask(projectsStore.currentId);
  ui.taskId = tid;
  if (tid) {
    taskStore.setTaskId(tid);
    void syncTaskFromServer(tid);
  }
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
