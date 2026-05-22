<template>
  <section class="memory-pane">
    <PaneHeader
      :title="t('configure.memory.title')"
      :subtitle="t('configure.memory.subtitle')"
    />
    <label class="memory-pane__toggle">
      <input
        v-model="settings.form.swarm_pattern_memory"
        type="checkbox"
        @change="onChange"
      />
      <span>{{ t("configure.memory.enable") }}</span>
    </label>
    <label class="memory-pane__field">
      <span class="memory-pane__label">
        {{ t("configure.memory.namespace") }}
      </span>
      <input
        v-model="settings.form.swarm_memory_namespace"
        type="text"
        class="memory-pane__input"
        :disabled="!settings.form.swarm_pattern_memory"
        @input="onChange"
      />
    </label>
    <label class="memory-pane__field">
      <span class="memory-pane__label">
        {{ t("configure.memory.path") }}
      </span>
      <FilePathPicker
        v-model="settings.form.swarm_pattern_memory_path"
        placeholder=".swarm/pattern_memory.json"
        :file-extensions="['json', 'jsonl']"
        :default-path="settings.form.workspace_root"
        @update:model-value="onChange"
      />
    </label>

    <section v-if="settings.form.swarm_pattern_memory" class="memory-pane__entries">
      <h3 class="memory-pane__section-title">{{ t("configure.memory.notesTitle") }}</h3>
      <MemoryPanel />
    </section>

    <section v-if="settings.form.swarm_pattern_memory" class="memory-pane__entries">
      <PromotionsQueue :workspace-root="settings.form.workspace_root ?? ''" />
    </section>
  </section>
</template>

<script setup lang="ts">
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import MemoryPanel from "@/features/memory-panel/MemoryPanel.vue";
import PromotionsQueue from "@/features/memory-panel/PromotionsQueue.vue";
import FilePathPicker from "@/shared/components/FilePathPicker.vue";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useI18n } from "@/shared/lib/i18n";

const settings = useInjectedAppSettings();
const { t } = useI18n();

function onChange(): void {
  settings.saveSettingsSoon();
}
</script>

<style scoped>
.memory-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 640px;
}

.memory-pane__toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
}

.memory-pane__toggle input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
}

.memory-pane__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.memory-pane__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2);
}

.memory-pane__input {
  appearance: none;
  width: 100%;
  padding: 9px 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-size: 13px;
  font-family: var(--font-mono);
}

.memory-pane__input:disabled {
  opacity: 0.5;
}

.memory-pane__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.memory-pane__entries {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.memory-pane__section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
  margin: 0;
}
</style>
