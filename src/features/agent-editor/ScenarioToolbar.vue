<template>
  <div class="scenario-toolbar">
    <div class="scenario-toolbar__row">
      <select
        v-model="selectedScenarioId"
        class="scenario-toolbar__select"
        :disabled="catalog.loading.value"
      >
        <option value="">{{ t("scenarios.editor.openScenario") }}</option>
        <option
          v-for="scenario in catalog.scenarios.value"
          :key="scenario.id"
          :value="scenario.id"
        >
          {{ scenario.title }}
        </option>
      </select>
      <button
        type="button"
        class="scenario-toolbar__btn"
        :disabled="!selectedScenarioId"
        @click="onOpen"
      >
        {{ t("scenarios.select") }}
      </button>
      <button
        type="button"
        class="scenario-toolbar__btn"
        :disabled="!canDuplicate"
        @click="onDuplicate"
      >
        {{ t("scenarios.editor.duplicate") }}
      </button>
      <button type="button" class="scenario-toolbar__btn" @click="onExport">
        {{ t("scenarios.editor.exportJson") }}
      </button>
      <span v-if="copied" class="scenario-toolbar__hint">
        {{ t("scenarios.editor.copied") }}
      </span>
      <span v-if="modeLabel" class="scenario-toolbar__status">
        {{ modeLabel }}
      </span>
    </div>
    <div v-if="integration.loadError.value" class="scenario-toolbar__error">
      {{
        t("scenarios.editor.loadFailed", {
          error: integration.loadError.value,
        })
      }}
    </div>
    <div class="scenario-toolbar__import-row">
      <textarea
        v-model="importText"
        class="scenario-toolbar__textarea"
        rows="3"
        :placeholder="t('scenarios.editor.importPlaceholder')"
      />
      <button
        type="button"
        class="scenario-toolbar__btn"
        :disabled="!importText.trim()"
        @click="onImport"
      >
        {{ t("scenarios.editor.importJson") }}
      </button>
    </div>
    <div v-if="integration.importError.value" class="scenario-toolbar__error">
      {{
        t("scenarios.editor.importFailed", {
          error: integration.importError.value,
        })
      }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useScenarioCatalog } from "@/features/scenario-picker/useScenarioCatalog";
import { useScenarioGraphIntegration } from "./useScenarioGraphIntegration";

const { t } = useI18n();
const catalog = useScenarioCatalog();
const integration = useScenarioGraphIntegration();

const selectedScenarioId = ref<string>("");
const importText = ref<string>("");
const copied = ref<boolean>(false);

const canDuplicate = computed<boolean>(
  () =>
    integration.loadedScenarioMode.value === "official" &&
    integration.loadedScenarioId.value !== null,
);

const modeLabel = computed<string>(() => {
  const mode = integration.loadedScenarioMode.value;
  const id = integration.loadedScenarioId.value;
  if (!mode) return "";
  if (mode === "official" && id) {
    return t("scenarios.editor.editingScenario", { id });
  }
  if (mode === "custom") {
    return t("scenarios.editor.modeCustom");
  }
  if (mode === "imported") {
    return t("scenarios.editor.modeImported");
  }
  return "";
});

async function onOpen(): Promise<void> {
  if (!selectedScenarioId.value) return;
  try {
    await integration.loadScenarioIntoEditor(selectedScenarioId.value);
  } catch {
    return;
  }
}

function onDuplicate(): void {
  integration.duplicateLoadedAsCustom();
}

async function onExport(): Promise<void> {
  const json = integration.exportToScenarioJson();
  copied.value = false;
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    await navigator.clipboard.writeText(json);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1500);
  }
}

async function onImport(): Promise<void> {
  try {
    await integration.importFromScenarioJson(importText.value);
    importText.value = "";
  } catch {
    return;
  }
}
</script>

<style scoped>
.scenario-toolbar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border, #2a2f3e);
  background: var(--bg2, #1e2230);
}
.scenario-toolbar__row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.scenario-toolbar__select {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--bg, #161922);
  color: var(--text1, #c8cfe8);
  font-size: 12px;
}
.scenario-toolbar__btn {
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--bg, #161922);
  color: var(--text1, #c8cfe8);
  cursor: pointer;
  font-size: 12px;
}
.scenario-toolbar__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.scenario-toolbar__btn:not(:disabled):hover {
  background: color-mix(in srgb, var(--accent, #3b5bdb) 15%, var(--bg, #161922));
}
.scenario-toolbar__hint {
  font-size: 11px;
  color: var(--success, #51cf66);
}
.scenario-toolbar__status {
  margin-left: auto;
  font-size: 11px;
  color: var(--text2, #9dadd0);
}
.scenario-toolbar__error {
  font-size: 11px;
  color: var(--error, #f03e3e);
}
.scenario-toolbar__import-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
}
.scenario-toolbar__textarea {
  flex: 1;
  resize: vertical;
  min-height: 36px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--bg, #161922);
  color: var(--text1, #c8cfe8);
  font-family: inherit;
  font-size: 12px;
}
</style>
