<template>
  <div class="xval">
    <p class="xval__hint">{{ t("crossValidation.hint") }}</p>

    <p v-if="!validators.length" class="xval__empty">
      {{ t("crossValidation.empty") }}
    </p>

    <div v-for="(row, idx) in validators" :key="idx" class="xval-row">
      <div class="xval-row__head">
        <span class="xval-row__index">{{ idx + 1 }}</span>
        <select
          class="xval-source"
          :value="row.source"
          :aria-label="t('crossValidation.sourceLabel')"
          @change="update(idx, 'source', selectValue($event))"
        >
          <option value="role">{{ t("crossValidation.sourceRole") }}</option>
          <option value="model">{{ t("crossValidation.sourceModel") }}</option>
        </select>

        <select
          v-if="row.source === 'role'"
          class="xval-role"
          :value="row.role"
          :aria-label="t('crossValidation.roleLabel')"
          @change="update(idx, 'role', selectValue($event))"
        >
          <option value="">{{ t("crossValidation.rolePlaceholder") }}</option>
          <option v-for="roleId in roles" :key="roleId" :value="roleId">
            {{ roleId }}
          </option>
        </select>

        <template v-else>
          <select
            class="xval-env"
            :value="row.environment"
            :aria-label="t('crossValidation.envLabel')"
            @change="update(idx, 'environment', selectValue($event))"
          >
            <option value="ollama">ollama</option>
            <option value="lmstudio">lmstudio</option>
            <option value="cloud">cloud</option>
          </select>
          <select
            v-if="row.environment === 'cloud'"
            class="xval-profile"
            :value="row.remote_profile"
            :aria-label="t('crossValidation.profileLabel')"
            @change="update(idx, 'remote_profile', selectValue($event))"
          >
            <option value="">{{ t("agentRoleRow.profilePlaceholder") }}</option>
            <option v-for="opt in profileOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <span
            v-if="uiState(idx).modelFetchError"
            class="model-fetch-error"
            :title="uiState(idx).modelFetchError!"
          >
            ⚠ {{ uiState(idx).modelFetchError }}
          </span>
          <select
            v-else-if="uiState(idx).modelChoices.length"
            class="xval-model"
            :value="modelSelValue(idx)"
            :aria-label="t('crossValidation.modelLabel')"
            @change="onModelChange(idx, selectValue($event))"
          >
            <option
              v-for="[val, lbl] in uiState(idx).modelChoices"
              :key="val"
              :value="val"
            >
              {{ lbl }}
            </option>
            <option value="__custom__">Custom…</option>
          </select>
          <input
            v-else
            type="text"
            class="xval-model"
            :placeholder="t('agentRoleRow.modelIdPlaceholder')"
            :aria-label="t('crossValidation.modelLabel')"
            autocomplete="off"
            :value="row.model"
            @input="update(idx, 'model', inputValue($event))"
          />
        </template>

        <div class="xval-row__actions">
          <button
            type="button"
            class="btn-icon"
            :disabled="idx === 0"
            :title="t('crossValidation.moveUp')"
            @click="move(idx, -1)"
          >
            &#8593;
          </button>
          <button
            type="button"
            class="btn-icon"
            :disabled="idx === validators.length - 1"
            :title="t('crossValidation.moveDown')"
            @click="move(idx, 1)"
          >
            &#8595;
          </button>
          <button
            type="button"
            class="btn-icon"
            :title="t('crossValidation.remove')"
            @click="remove(idx)"
          >
            &#10005;
          </button>
        </div>
      </div>

      <div
        v-if="row.source === 'model' && modelSelValue(idx) === '__custom__'"
        class="field"
      >
        <label class="field-label">{{ t("crossValidation.customModelLabel") }}</label>
        <input
          type="text"
          class="xval-model-custom"
          :placeholder="t('agentRoleRow.modelIdPlaceholder')"
          autocomplete="off"
          :value="row.model"
          @input="update(idx, 'model', inputValue($event))"
        />
      </div>

      <div class="field">
        <label class="field-label">{{ t("crossValidation.promptLabel") }}</label>
        <textarea
          class="xval-prompt"
          rows="2"
          :placeholder="t('crossValidation.promptPlaceholder')"
          :value="row.prompt"
          @input="update(idx, 'prompt', textareaValue($event))"
        ></textarea>
      </div>

      <label class="xval-editor">
        <input
          type="checkbox"
          :checked="row.apply_edits"
          @change="update(idx, 'apply_edits', checkboxValue($event))"
        />
        <span>{{ t("crossValidation.applyEdits") }}</span>
      </label>
    </div>

    <p v-if="editorCount > 1" class="xval__warn" role="alert">
      ⚠ {{ t("crossValidation.multipleEditorsWarning") }}
    </p>
    <p v-else-if="validators.length && editorCount === 0" class="xval__warn">
      {{ t("crossValidation.noEditorWarning") }}
    </p>

    <button type="button" class="btn-secondary xval__add" @click="emit('add')">
      {{ t("crossValidation.add") }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type { CrossValidatorSnap, CrossValidatorUiState } from "./useCrossValidation";

const props = defineProps<{
  validators: CrossValidatorSnap[];
  uiStates: CrossValidatorUiState[];
  roles: readonly string[];
  profileOptions: { value: string; label: string }[];
}>();

const emit = defineEmits<{
  add: [];
  remove: [idx: number];
  move: [idx: number, delta: number];
  update: [idx: number, field: keyof CrossValidatorSnap, value: string | boolean];
}>();

const { t } = useI18n();

const editorCount = computed(
  () => props.validators.filter((row) => row.apply_edits).length,
);

function uiState(idx: number): CrossValidatorUiState {
  return props.uiStates[idx] ?? { modelChoices: [], modelFetchError: null };
}

function modelSelValue(idx: number): string {
  const row = props.validators[idx];
  if (!row) return "";
  const choices = uiState(idx).modelChoices;
  if (!choices.length) return row.model;
  return choices.some(([value]) => value === row.model) ? row.model : "__custom__";
}

function onModelChange(idx: number, value: string): void {
  // "__custom__" only opens the free-text field; it is not a model id.
  emit("update", idx, "model", value === "__custom__" ? "" : value);
}

function selectValue(event: Event): string {
  return (event.target as HTMLSelectElement).value;
}

function inputValue(event: Event): string {
  return (event.target as HTMLInputElement).value;
}

function textareaValue(event: Event): string {
  return (event.target as HTMLTextAreaElement).value;
}

function checkboxValue(event: Event): boolean {
  return (event.target as HTMLInputElement).checked;
}

function update(
  idx: number,
  field: keyof CrossValidatorSnap,
  value: string | boolean,
): void {
  emit("update", idx, field, value);
}

function remove(idx: number): void {
  emit("remove", idx);
}

function move(idx: number, delta: number): void {
  emit("move", idx, delta);
}
</script>

<style scoped>
.xval {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.xval__hint,
.xval__empty,
.xval__warn {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3, #a8b0c4);
}
.xval__warn {
  color: var(--warn, #d9a441);
}
.xval-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: var(--r-md, 8px);
}
.xval-row__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.xval-row__index {
  flex: 0 0 auto;
  min-width: 18px;
  font-weight: 700;
  font-size: 12px;
  color: var(--ink-3, #a8b0c4);
}
/* The app styles bare selects as full-width block fields; inside the head row
   they have to share one line instead. */
.xval-row__head select,
.xval-row__head input[type="text"] {
  flex: 1 1 140px;
  width: auto;
  min-width: 0;
}
.xval-row__actions {
  display: flex;
  flex: 0 0 auto;
  gap: 4px;
  margin-left: auto;
}
.xval-prompt {
  width: 100%;
  resize: vertical;
  font-size: 12px;
}
.xval-editor {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.xval__add {
  align-self: flex-start;
}
</style>
