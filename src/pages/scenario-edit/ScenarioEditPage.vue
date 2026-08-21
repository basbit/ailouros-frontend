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
import { toRef } from "vue";
import AppShell from "@/widgets/app-shell/AppShell.vue";
import AppHeaderContainer from "@/widgets/header/AppHeaderContainer.vue";
import PipelineStepEditor from "@/features/pipeline/PipelineStepEditor.vue";
import { useI18n } from "@/shared/lib/i18n";
import { useScenarioForm } from "./useScenarioForm";

const props = defineProps<{
  scenarioId?: string;
}>();

const { t } = useI18n();

const scenarioIdRef = toRef(props, "scenarioId");
const {
  form,
  stepOptions,
  isEditMode,
  validationError,
  pageTitle,
  onAddStep,
  onRemoveStep,
  onMoveStep,
  onUpdateStep,
  onCancel,
  onSave,
} = useScenarioForm(() => scenarioIdRef.value);
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
