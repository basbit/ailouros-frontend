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
        :title="t('promptCoach.openLabel')"
        @click="promptCoachOpen = true"
      >
        {{ t("promptCoach.openLabel") }}
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
      :aria-expanded="isAdvancedSidebarOpen"
      @click="emit('toggle-advanced-sidebar')"
    >
      {{ isAdvancedSidebarOpen ? t("page.advanced.hide") : t("page.advanced.show") }}
    </button>
    <template v-if="isAdvancedSidebarOpen">
      <MemoryPanel @append-to-prompt="onAppendToPrompt" />
      <WikiQualitySection :workspace-root="settings.form.workspace_root" />
      <RetrievalTraceInspector :workspace-root="settings.form.workspace_root" />
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

    <SidebarTaskGates
      :manual-sudo-command="manualSudoCommand"
      :current-pipeline-steps="currentPipelineSteps"
      :prompt-coach-open="promptCoachOpen"
      @human-resume="(feedback) => emit('human-resume', feedback)"
      @confirm-shell="(allow) => emit('confirm-shell', allow)"
      @open-sudo-prompt="emit('open-sudo-prompt')"
      @confirm-manual-shell="(done) => emit('confirm-manual-shell', done)"
      @retry="(fromBeginning) => emit('retry', fromBeginning)"
      @continue-pipeline="(steps) => emit('continue-pipeline', steps)"
      @update:prompt-coach-open="promptCoachOpen = $event"
      @prompt-coach-apply="onPromptCoachApply"
    />

    <SidebarRunStatus
      :task-error="ui.taskError"
      :blocked-reason="ui.blockedReason"
      :blocked-step="ui.blockedStep"
      :blocked-code="ui.blockedCode"
      :scenario-id="ui.taskScenarioId"
      :scenario-title="ui.taskScenarioTitle"
      :scenario-category="ui.taskScenarioCategory"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import PromptInput from "@/features/prompt-input/PromptInput.vue";
import ScenarioInputs from "@/features/scenario-picker/ScenarioInputs.vue";
import MemoryPanel from "@/features/memory-panel/MemoryPanel.vue";
import { CrossProjectStats } from "@/widgets/observability";
import WikiQualitySection from "@/widgets/wiki-quality-section/WikiQualitySection.vue";
import RetrievalTraceInspector from "@/widgets/retrieval-trace-inspector/RetrievalTraceInspector.vue";
import SidebarRunStatus from "./SidebarRunStatus.vue";
import SidebarTaskGates from "./SidebarTaskGates.vue";
import { useI18n } from "@/shared/lib/i18n";
import { useUiStore } from "@/shared/store/ui";
import type { AppSettings } from "@/entities/app-settings/contract";
import type { ScenarioInputSpec } from "@/entities/scenario";

type SettingsApi = AppSettings;

defineProps<{
  settings: SettingsApi;
  scenarioInputs: ScenarioInputSpec[];
  scenarioInputValues: Record<string, string | boolean>;
  scenarioPreviewTitle: string | undefined;
  isRunning: boolean;
  isAdvancedSidebarOpen: boolean;
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
  (e: "human-resume", feedback: string): void;
  (e: "confirm-shell", allow: boolean): void;
  (e: "open-sudo-prompt"): void;
  (e: "confirm-manual-shell", done: boolean): void;
  (e: "retry", fromBeginning: boolean): void;
  (e: "continue-pipeline", additionalSteps: string[]): void;
}>();

const { t } = useI18n();
const ui = useUiStore();
const promptCoachOpen = ref(false);

function onPromptUpdate(val: string): void {
  emit("update:prompt", val);
}

function onPromptCoachApply(body: string): void {
  emit("update:prompt", body);
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
</style>
