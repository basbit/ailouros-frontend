<template>
  <section v-if="missingRequiredInputs.length" class="scenario-inputs">
    <header class="scenario-inputs__head">
      <span class="scenario-inputs__title">
        {{ t("scenarios.preview.inputs") }}
      </span>
      <span v-if="props.scenarioTitle" class="scenario-inputs__scenario">
        {{ props.scenarioTitle }}
      </span>
    </header>
    <div class="scenario-inputs__body">
      <div
        v-for="input in missingRequiredInputs"
        :key="input.key"
        class="scenario-inputs__row"
      >
        <label class="scenario-inputs__label" :for="`scn-input-${input.key}`">
          <span class="scenario-inputs__label-text">{{ input.label }}</span>
          <span class="scenario-inputs__required">
            {{ t("scenarios.preview.inputRequired") }}
          </span>
        </label>
        <input
          v-if="!isCheckboxInput(input.key)"
          :id="`scn-input-${input.key}`"
          type="text"
          class="scenario-inputs__input"
          :value="textValue(input.key)"
          :placeholder="input.hint"
          :disabled="props.disabled"
          @input="onTextInput(input.key, $event)"
        />
        <label v-else class="scenario-inputs__checkbox">
          <input
            type="checkbox"
            :checked="checkboxValue(input.key)"
            :disabled="props.disabled"
            @change="onCheckboxInput(input.key, $event)"
          />
          <span>{{ input.hint || input.label }}</span>
        </label>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type { ScenarioInputSpec } from "@/shared/model/scenario-types";

const props = defineProps<{
  inputs: ScenarioInputSpec[];
  values: Record<string, string | boolean>;
  scenarioTitle?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:value": [key: string, value: string | boolean];
}>();

const { t } = useI18n();

const missingRequiredInputs = computed(() =>
  (props.inputs ?? []).filter((input) => input.required && inputMissing(input.key)),
);

function inputMissing(key: string): boolean {
  const raw = props.values?.[key];
  if (typeof raw === "boolean") return !raw;
  return !String(raw ?? "").trim();
}

function isCheckboxInput(key: string): boolean {
  return key === "workspace_write";
}

function textValue(key: string): string {
  const raw = props.values?.[key];
  if (typeof raw === "string") return raw;
  if (typeof raw === "boolean") return raw ? "1" : "";
  return "";
}

function checkboxValue(key: string): boolean {
  const raw = props.values?.[key];
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") return raw === "1" || raw === "true";
  return false;
}

function onTextInput(key: string, event: Event): void {
  const target = event.target as HTMLInputElement | null;
  emit("update:value", key, target?.value ?? "");
}

function onCheckboxInput(key: string, event: Event): void {
  const target = event.target as HTMLInputElement | null;
  emit("update:value", key, !!target?.checked);
}
</script>

<style scoped>
.scenario-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 10px;
  background: color-mix(in srgb, var(--surface, #1a1d29) 65%, transparent);
  margin-bottom: 10px;
}
.scenario-inputs__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.scenario-inputs__title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text2, #a8b0c4);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.scenario-inputs__scenario {
  font-size: 11px;
  color: var(--text3, #6b7280);
}
.scenario-inputs__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.scenario-inputs__row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.scenario-inputs__label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.scenario-inputs__label-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--text, #f5f0e7);
}
.scenario-inputs__required {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--accent, #3b5bdb) 35%, transparent);
  color: var(--text, #f5f0e7);
  text-transform: uppercase;
}
.scenario-inputs__input {
  font-size: 12px;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--surface, #1a1d29);
  color: var(--text, #f5f0e7);
}
.scenario-inputs__input:focus {
  outline: none;
  border-color: var(--accent, #3b5bdb);
}
.scenario-inputs__checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text, #f5f0e7);
}
</style>
