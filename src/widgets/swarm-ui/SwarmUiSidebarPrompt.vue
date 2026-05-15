<template>
  <div class="section">
    <div class="section-title">{{ t("page.prompt") }}</div>
    <div class="prompt-actions">
      <button
        type="button"
        class="prompt-action"
        :title="t('promptLibrary.openLabel')"
        @click="emit('open-prompt-library')"
      >
        {{ t("promptLibrary.openLabel") }}
      </button>
      <button
        type="button"
        class="prompt-action"
        :disabled="!settings.form.workspace_root.trim()"
        :title="t('assetUpload.title')"
        @click="emit('open-asset-upload')"
      >
        {{ t("assetUpload.title") }}
      </button>
      <button
        type="button"
        class="prompt-action"
        :title="t('reportProblem.title')"
        @click="emit('open-report-problem')"
      >
        {{ t("reportProblem.title") }}
      </button>
    </div>
    <PromptInput
      :model-value="settings.form.prompt"
      :workspace-root="settings.form.workspace_root"
      :rows="5"
      :placeholder="t('prompt.placeholder')"
      @update:model-value="onPromptUpdate"
    />
    <ScenarioInputs
      :inputs="scenarioInputs"
      :values="scenarioInputValues"
      :scenario-title="scenarioPreviewTitle"
      :disabled="isRunning"
      @update:value="(key, val) => emit('scenario-input-update', key, val)"
    />

    <button
      type="button"
      class="sidebar-advanced-toggle"
      :aria-expanded="advancedSidebarOpen"
      @click="emit('toggle-advanced-sidebar')"
    >
      {{ advancedSidebarOpen ? t("page.advanced.hide") : t("page.advanced.show") }}
    </button>
    <template v-if="advancedSidebarOpen">
      <MemoryPanel @append-to-prompt="onAppendToPrompt" />
      <CrossProjectStats />
    </template>

    <div class="run-controls" style="margin-top: 10px">
      <div class="field">
        <label class="checkbox-row">
          <input
            id="human_manual_review"
            type="checkbox"
            :checked="settings.form.human_manual_review"
            @change="onHumanManualReviewChange"
          />
          <span class="check-label">{{ t("page.manualReview") }}</span>
        </label>
      </div>
      <div class="field">
        <label class="checkbox-row">
          <input
            id="swarm_force_rerun"
            type="checkbox"
            :checked="settings.form.swarm_force_rerun"
            @change="onForceRerunChange"
          />
          <span class="check-label">{{ t("auto.forceRerunLabel") }}</span>
        </label>
        <div class="hint">{{ t("auto.forceRerunHint") }}</div>
      </div>
      <div
        v-if="!isRunning && scenarioReadinessScenario && missingKeys.length"
        class="scenario-readiness-warning"
      >
        {{
          t("scenarios.preflight.missingInputs", {
            scenario: scenarioReadinessScenario.title,
            fields: missingKeys.join(", "),
          })
        }}
      </div>
      <button
        v-if="!isRunning"
        class="start-btn"
        :disabled="!scenarioReadinessReady"
        :title="
          !scenarioReadinessReady
            ? t('scenarios.preflight.missingInputs', {
                scenario: scenarioReadinessScenario?.title ?? '',
                fields: missingKeys.join(', '),
              })
            : ''
        "
        @click="emit('start-run')"
      >
        &#9654; {{ t("page.start") }}
      </button>
      <button v-else class="stop-btn" @click="emit('stop-run')">
        &#9646;&#9646; {{ t("page.stop") }}
      </button>
    </div>

    <HumanGate
      :visible="ui.humanGateVisible"
      :title="ui.humanGateTitle"
      :feedback="ui.humanGateFeedback"
      :task-id="ui.taskId ?? undefined"
      :submitting="ui.humanGateSubmitting"
      @update:feedback="ui.humanGateFeedback = $event"
      @submit="emit('human-resume')"
    />

    <ShellGate
      :visible="ui.shellGateVisible"
      :commands="ui.shellGateCommands"
      :needs-allowlist="ui.shellGateNeedsAllowlist"
      :already-allowed="ui.shellGateAlreadyAllowed"
      @confirm="(allow) => emit('confirm-shell', allow)"
    />

    <ManualShellGate
      :visible="ui.manualShellGateVisible"
      :commands="ui.manualShellCommands"
      :reason="ui.manualShellReason"
      :sudo-prompt-available="!!manualSudoCommand"
      @open-sudo-prompt="emit('open-sudo-prompt')"
      @confirm="(done) => emit('confirm-manual-shell', done)"
    />

    <RetryGate
      :visible="ui.retryGateVisible"
      :failed-step="ui.retryFailedStep"
      :current-pipeline-steps="currentPipelineSteps"
      @retry="(fromBeginning) => emit('retry', fromBeginning)"
      @continue-pipeline="(steps) => emit('continue-pipeline', steps)"
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

    <div v-if="ui.taskScenarioId" class="task-scenario-badge">
      <span class="task-scenario-badge__label">{{ t("scenarios.runningAs") }}</span>
      <span class="task-scenario-badge__title">
        {{ ui.taskScenarioTitle ?? ui.taskScenarioId }}
      </span>
      <span v-if="ui.taskScenarioCategory" class="task-scenario-badge__category">
        {{ t(`scenarios.tab.${ui.taskScenarioCategory}`) }}
      </span>
    </div>

    <!--
      Note: the per-step "agentChips" list was removed (2026-05-14).
      The same information is surfaced by the pipeline graph in the main
      view and by the blocked / retry banners above; duplicating it as a
      flat chip list in the sidebar menu added visual noise without
      adding signal. See docs/improve-plan-done.md "Sidebar agent chips" item.
    -->
  </div>
</template>

<script setup lang="ts">
import PromptInput from "@/features/prompt-input/PromptInput.vue";
import ScenarioInputs from "@/features/scenario-picker/ScenarioInputs.vue";
import MemoryPanel from "@/features/memory-panel/MemoryPanel.vue";
import CrossProjectStats from "@/widgets/observability/CrossProjectStats.vue";
import HumanGate from "@/features/task-gate/HumanGate.vue";
import ShellGate from "@/features/task-gate/ShellGate.vue";
import ManualShellGate from "@/features/task-gate/ManualShellGate.vue";
import RetryGate from "@/features/task-gate/RetryGate.vue";
import { useI18n } from "@/shared/lib/i18n";
import { useUiStore } from "@/shared/store/ui";
import type { useSettings } from "@/widgets/settings/useSettings";
import type { ScenarioInputSpec } from "@/shared/model/scenario-types";

type SettingsApi = ReturnType<typeof useSettings>;

defineProps<{
  settings: SettingsApi;
  scenarioInputs: ScenarioInputSpec[];
  scenarioInputValues: Record<string, string | boolean>;
  scenarioPreviewTitle: string | undefined;
  isRunning: boolean;
  advancedSidebarOpen: boolean;
  scenarioReadinessReady: boolean;
  scenarioReadinessScenario: { title: string } | null | undefined;
  missingKeys: string[];
  manualSudoCommand: string;
  currentPipelineSteps: string[];
}>();

const emit = defineEmits<{
  (e: "open-prompt-library"): void;
  (e: "open-asset-upload"): void;
  (e: "open-report-problem"): void;
  (e: "update:prompt", val: string): void;
  (e: "scenario-input-update", key: string, val: string | boolean): void;
  (e: "toggle-advanced-sidebar"): void;
  (e: "append-to-prompt", text: string): void;
  (e: "update:human-manual-review", val: boolean): void;
  (e: "swarm-form-update", field: string, value: string): void;
  (e: "start-run"): void;
  (e: "stop-run"): void;
  (e: "human-resume"): void;
  (e: "confirm-shell", allow: boolean): void;
  (e: "open-sudo-prompt"): void;
  (e: "confirm-manual-shell", done: boolean): void;
  (e: "retry", fromBeginning: boolean): void;
  (e: "continue-pipeline", additionalSteps: string[]): void;
}>();

const { t } = useI18n();
const ui = useUiStore();

function onPromptUpdate(val: string): void {
  emit("update:prompt", val);
}

function onAppendToPrompt(text: string): void {
  emit("append-to-prompt", text);
}

function onHumanManualReviewChange(event: Event): void {
  emit("update:human-manual-review", (event.target as HTMLInputElement).checked);
}

function onForceRerunChange(event: Event): void {
  const checked = (event.target as HTMLInputElement).checked;
  emit("swarm-form-update", "swarm_force_rerun", String(checked));
}
</script>

<style scoped>
.sidebar-advanced-toggle {
  display: block;
  width: 100%;
  margin: 8px 0 4px;
  padding: 6px 10px;
  font-size: 11px;
  color: var(--text2, #a8b0c4);
  background: transparent;
  border: 1px dashed var(--border, #2a2f3e);
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  letter-spacing: 0.02em;
}
.sidebar-advanced-toggle:hover {
  color: var(--text, #f5f0e7);
  border-color: var(--accent, #3b5bdb);
}
.prompt-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}
.prompt-action {
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 6px;
  background: var(--surface2, #14171f);
  color: var(--text, #f5f0e7);
  padding: 5px 8px;
  font-size: 11px;
  line-height: 1.2;
  cursor: pointer;
}
.prompt-action:hover:not(:disabled) {
  border-color: var(--border-focus, #3b5bdb);
}
.prompt-action:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.task-scenario-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  margin: 6px 0;
  background: color-mix(in srgb, var(--accent, #3b5bdb) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent, #3b5bdb) 50%, transparent);
  border-radius: 999px;
  font-size: 11px;
  color: var(--text, #f5f0e7);
}
.task-scenario-badge__label {
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 10px;
}
.task-scenario-badge__title {
  font-weight: 600;
}
.task-scenario-badge__category {
  padding: 1px 6px;
  background: color-mix(in srgb, var(--accent, #3b5bdb) 35%, transparent);
  border-radius: 4px;
  font-size: 10px;
}
.scenario-readiness-warning {
  font-size: 11px;
  color: var(--text, #f5f0e7);
  background: color-mix(in srgb, #d99f24 18%, transparent);
  border: 1px solid color-mix(in srgb, #d99f24 50%, transparent);
  border-radius: 6px;
  padding: 6px 10px;
  margin: 6px 0;
}
.start-btn[disabled] {
  opacity: 0.55;
  cursor: not-allowed;
}
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
