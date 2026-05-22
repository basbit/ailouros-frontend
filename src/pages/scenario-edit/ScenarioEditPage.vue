<template>
  <AppShell>
    <template #header>
      <AppHeaderContainer />
    </template>
    <div class="scenario-edit-page">
      <header class="scenario-edit-page__header">
        <button type="button" class="scenario-edit-page__back" @click="onCancel">
          ← {{ t("settings.scenarios.editor.cancel") }}
        </button>
        <h1 class="scenario-edit-page__title">{{ pageTitle }}</h1>
      </header>

      <form class="scenario-edit-page__form" @submit.prevent="onSave">
        <label class="scenario-edit-page__field">
          <span class="scenario-edit-page__label">
            {{ t("settings.scenarios.editor.idField") }}
          </span>
          <input
            v-model="form.id"
            type="text"
            class="scenario-edit-page__input"
            :disabled="isEditMode"
            autocomplete="off"
          />
          <span class="scenario-edit-page__hint">
            {{ t("settings.scenarios.editor.idHint") }}
          </span>
        </label>

        <label class="scenario-edit-page__field">
          <span class="scenario-edit-page__label">
            {{ t("settings.scenarios.editor.titleField") }}
          </span>
          <input
            v-model="form.title"
            type="text"
            class="scenario-edit-page__input"
            autocomplete="off"
          />
        </label>

        <section class="scenario-edit-page__steps">
          <PipelineStepEditor
            :model-value="form.steps"
            :step-options="stepOptions"
            :label="t('settings.scenarios.editor.stepsField')"
            :add-label="t('configure.pipeline.addStep')"
            :up-label="t('configure.pipeline.moveStepUp')"
            :down-label="t('configure.pipeline.moveStepDown')"
            :remove-label="t('configure.pipeline.removeStep')"
            @add="onAddStep"
            @remove="onRemoveStep"
            @move="onMoveStep"
            @update="onUpdateStep"
          />
        </section>

        <label class="scenario-edit-page__toggle">
          <input v-model="form.workspaceWriteDefault" type="checkbox" />
          <span>{{ t("settings.scenarios.editor.workspaceWriteDefault") }}</span>
        </label>

        <p v-if="validationError" class="scenario-edit-page__error">
          {{ validationError }}
        </p>

        <footer class="scenario-edit-page__actions">
          <button type="button" class="scenario-edit-page__btn" @click="onCancel">
            {{ t("settings.scenarios.editor.cancel") }}
          </button>
          <button
            type="submit"
            class="scenario-edit-page__btn scenario-edit-page__btn--primary"
            :disabled="!!validationError"
          >
            {{ t("settings.scenarios.editor.save") }}
          </button>
        </footer>
      </form>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import AppShell from "@/widgets/app-shell/AppShell.vue";
import AppHeaderContainer from "@/widgets/header/AppHeaderContainer.vue";
import PipelineStepEditor, {
  type PipelineStepRow,
} from "@/features/pipeline/PipelineStepEditor.vue";
import { pipelineOptionsAll } from "@/features/pipeline/usePipeline";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  scenarioId?: string;
}>();

const settings = useInjectedAppSettings();
const router = useRouter();
const { t } = useI18n();

const customScenarios = computed(() => settings.form.custom_scenarios ?? []);
const customRoles = computed(() => settings.customRolesState.customRoles.value);

const stepOptions = computed<[string, string][]>(() =>
  pipelineOptionsAll(customRoles.value),
);

const isEditMode = computed(() => Boolean(props.scenarioId));

let uidCounter = 0;
function makeUid(): string {
  uidCounter += 1;
  return `s-${Date.now().toString(36)}-${uidCounter}`;
}

interface FormState {
  id: string;
  title: string;
  steps: PipelineStepRow[];
  workspaceWriteDefault: boolean;
}

const form = reactive<FormState>({
  id: "",
  title: "",
  steps: [],
  workspaceWriteDefault: false,
});

const existingIds = computed<string[]>(() =>
  customScenarios.value.map((entry) => entry.id),
);

const validationError = computed<string | null>(() => {
  const trimmedId = form.id.trim();
  if (!trimmedId) return t("settings.scenarios.editor.validationId");
  if (!isEditMode.value && existingIds.value.includes(trimmedId)) {
    return t("settings.scenarios.editor.validationId");
  }
  if (form.steps.length === 0) {
    return t("settings.scenarios.editor.validationSteps");
  }
  return null;
});

const pageTitle = computed(() =>
  isEditMode.value
    ? t("settings.scenarios.editor.titleEdit")
    : t("settings.scenarios.editor.titleNew"),
);

function hydrate(): void {
  if (!props.scenarioId) {
    form.id = "";
    form.title = "";
    form.steps = [];
    form.workspaceWriteDefault = false;
    return;
  }
  const entry = customScenarios.value.find((item) => item.id === props.scenarioId);
  if (!entry) {
    void router.replace("/settings/scenarios");
    return;
  }
  form.id = entry.id;
  form.title = entry.title;
  form.steps = entry.pipeline_steps.map((stepId) => ({ uid: makeUid(), id: stepId }));
  form.workspaceWriteDefault = entry.workspace_write_default;
}

watch(() => props.scenarioId, hydrate, { immediate: true });

function onAddStep(): void {
  const fallbackOption = stepOptions.value[0];
  if (!fallbackOption) {
    throw new Error("scenario-edit: pipeline step options are empty");
  }
  form.steps = [...form.steps, { uid: makeUid(), id: fallbackOption[0] }];
}

function onRemoveStep(index: number): void {
  form.steps = form.steps.filter((_, idx) => idx !== index);
}

function onMoveStep(index: number, delta: number): void {
  const target = index + delta;
  if (target < 0 || target >= form.steps.length) return;
  const next = form.steps.slice();
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  form.steps = next;
}

function onUpdateStep(index: number, nextId: string): void {
  const next = form.steps.slice();
  if (!next[index]) return;
  next[index] = { ...next[index], id: nextId };
  form.steps = next;
}

function onCancel(): void {
  void router.push("/settings/scenarios");
}

function onSave(): void {
  if (validationError.value) return;
  const trimmedId = form.id.trim();
  const next = customScenarios.value.slice();
  const idx = next.findIndex((entry) => entry.id === trimmedId);
  const payload = {
    id: trimmedId,
    title: form.title.trim() || trimmedId,
    pipeline_steps: form.steps.map((row) => row.id),
    workspace_write_default: form.workspaceWriteDefault,
  };
  if (idx >= 0) {
    next[idx] = payload;
  } else {
    next.push(payload);
  }
  settings.form.custom_scenarios = next;
  settings.saveSettingsSoon();
  void router.push("/settings/scenarios");
}
</script>

<style scoped>
.scenario-edit-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 760px;
  margin: 0 auto;
  width: 100%;
}

.scenario-edit-page__header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.scenario-edit-page__back {
  appearance: none;
  background: transparent;
  border: none;
  color: var(--ink-2);
  font-size: 13px;
  cursor: pointer;
}

.scenario-edit-page__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.scenario-edit-page__form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.scenario-edit-page__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scenario-edit-page__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2);
}

.scenario-edit-page__input {
  appearance: none;
  padding: 8px 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  font-size: 13px;
  color: var(--ink);
}

.scenario-edit-page__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.scenario-edit-page__hint {
  font-size: 11px;
  color: var(--ink-3);
}

.scenario-edit-page__steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scenario-edit-page__toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
}

.scenario-edit-page__error {
  margin: 0;
  color: var(--error, #c33);
  font-size: 12px;
}

.scenario-edit-page__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.scenario-edit-page__btn {
  appearance: none;
  padding: 8px 16px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-size: 13px;
  cursor: pointer;
}

.scenario-edit-page__btn--primary {
  background: var(--accent);
  color: #fff;
  border-color: transparent;
}

.scenario-edit-page__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
