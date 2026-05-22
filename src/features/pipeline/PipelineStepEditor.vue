<template>
  <div class="pipeline-step-editor">
    <span v-if="label" class="pipeline-step-editor__label">{{ label }}</span>
    <ol class="pipeline-step-editor__list">
      <li
        v-for="(step, index) in modelValue"
        :key="step.uid"
        class="pipeline-step-editor__row"
      >
        <span class="pipeline-step-editor__index">{{ index + 1 }}</span>
        <button
          type="button"
          class="pipeline-step-editor__role-button"
          :title="t('rolePicker.openLabel')"
          @click="openPicker(step.uid)"
        >
          <span class="pipeline-step-editor__role-label">
            {{ labelFor(step.id) }}
          </span>
          <span class="pipeline-step-editor__role-id">{{ step.id }}</span>
        </button>
        <div class="pipeline-step-editor__actions">
          <button
            type="button"
            class="pipeline-step-editor__icon"
            :disabled="index === 0"
            :aria-label="upLabel"
            @click="emitMove(index, -1)"
          >
            ↑
          </button>
          <button
            type="button"
            class="pipeline-step-editor__icon"
            :disabled="index === modelValue.length - 1"
            :aria-label="downLabel"
            @click="emitMove(index, 1)"
          >
            ↓
          </button>
          <button
            type="button"
            class="pipeline-step-editor__icon pipeline-step-editor__icon--remove"
            :aria-label="removeLabel"
            @click="emitRemove(index)"
          >
            ×
          </button>
        </div>
      </li>
    </ol>
    <button type="button" class="pipeline-step-editor__add" @click="emitAdd">
      + {{ addLabel }}
    </button>
    <button
      v-if="resetLabel"
      type="button"
      class="pipeline-step-editor__reset"
      @click="emitReset"
    >
      {{ resetLabel }}
    </button>
    <RolePickerPopover
      :open="pickerOpenUid !== ''"
      :model-value="currentPickerStepId"
      :roles="roleSummaries"
      @update:model-value="onRolePicked"
      @close="pickerOpenUid = ''"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import RolePickerPopover, { type RoleSummary } from "@/shared/ui/RolePickerPopover.vue";
import { useI18n } from "@/shared/lib/i18n";

export interface PipelineStepRow {
  uid: string;
  id: string;
}

const props = defineProps<{
  modelValue: PipelineStepRow[];
  stepOptions: [string, string][];
  label?: string;
  addLabel: string;
  upLabel: string;
  downLabel: string;
  removeLabel: string;
  resetLabel?: string;
}>();

const emit = defineEmits<{
  add: [];
  remove: [index: number];
  move: [index: number, delta: number];
  update: [index: number, nextId: string];
  reset: [];
}>();

const { t } = useI18n();

const pickerOpenUid = ref<string>("");

const optionLabelMap = computed<Map<string, string>>(() => {
  const map = new Map<string, string>();
  for (const [id, title] of props.stepOptions) {
    map.set(id, title);
  }
  return map;
});

const roleSummaries = computed<RoleSummary[]>(() =>
  props.stepOptions.map(([id, title]) => ({
    id,
    title,
    summary: "",
    skills: [],
  })),
);

const currentPickerStepId = computed<string>(() => {
  if (!pickerOpenUid.value) return "";
  const row = props.modelValue.find((entry) => entry.uid === pickerOpenUid.value);
  return row?.id ?? "";
});

function labelFor(stepId: string): string {
  return optionLabelMap.value.get(stepId) ?? stepId;
}

function openPicker(uid: string): void {
  pickerOpenUid.value = uid;
}

function onRolePicked(nextId: string): void {
  const uid = pickerOpenUid.value;
  if (!uid) return;
  const index = props.modelValue.findIndex((entry) => entry.uid === uid);
  pickerOpenUid.value = "";
  if (index < 0) return;
  emit("update", index, nextId);
}

function emitAdd(): void {
  emit("add");
}

function emitRemove(index: number): void {
  emit("remove", index);
}

function emitMove(index: number, delta: number): void {
  emit("move", index, delta);
}

function emitReset(): void {
  emit("reset");
}
</script>

<style scoped>
.pipeline-step-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pipeline-step-editor__label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2);
}

.pipeline-step-editor__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pipeline-step-editor__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
}

.pipeline-step-editor__index {
  font-family: var(--font-mono);
  color: var(--ink-3);
  font-size: 12px;
  min-width: 18px;
  text-align: right;
}

.pipeline-step-editor__role-button {
  flex: 1;
  appearance: none;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 6px 12px;
  background: var(--card);
  color: var(--ink);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: baseline;
  gap: 10px;
  justify-content: space-between;
}

.pipeline-step-editor__role-button:hover {
  border-color: var(--line-strong);
}

.pipeline-step-editor__role-label {
  font-weight: 500;
}

.pipeline-step-editor__role-id {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-3);
}

.pipeline-step-editor__actions {
  display: flex;
  gap: 4px;
}

.pipeline-step-editor__icon {
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink-2);
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pipeline-step-editor__icon:hover:not(:disabled) {
  border-color: var(--line-strong);
  color: var(--ink);
}

.pipeline-step-editor__icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pipeline-step-editor__icon--remove:hover {
  color: var(--danger, #c33);
  border-color: var(--danger, #c33);
}

.pipeline-step-editor__add {
  appearance: none;
  background: transparent;
  border: 1px dashed var(--line);
  border-radius: var(--r-md);
  padding: 8px 14px;
  font-size: 12px;
  color: var(--ink-2);
  cursor: pointer;
  align-self: flex-start;
}

.pipeline-step-editor__add:hover {
  border-color: var(--line-strong);
  color: var(--ink);
}

.pipeline-step-editor__reset {
  appearance: none;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 6px 12px;
  font-size: 12px;
  color: var(--ink-2);
  cursor: pointer;
  align-self: flex-start;
}
</style>
