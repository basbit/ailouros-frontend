<template>
  <section class="project-pane">
    <PaneHeader
      :title="t('configure.project.title')"
      :subtitle="t('configure.project.subtitle')"
    />
    <p class="project-pane__banner">{{ t("configure.apiKeysBanner") }}</p>
    <form class="project-pane__form" @submit.prevent>
      <div class="project-pane__field">
        <span class="project-pane__label">
          {{ t("configure.project.workspaceRoot") }}
        </span>
        <FilePathPicker
          :model-value="form.workspace_root"
          :placeholder="t('configure.project.workspaceRoot')"
          :directory="true"
          :picker-title="t('projectForm.pickFolder')"
          @update:model-value="onWorkspaceRootChange"
        />
      </div>
      <div class="project-pane__field">
        <span class="project-pane__label">
          {{ t("configure.project.contextFile") }}
        </span>
        <FilePathPicker
          :model-value="form.project_context_file"
          :placeholder="t('configure.project.contextFile')"
          :file-extensions="['md', 'markdown', 'txt']"
          :default-path="form.workspace_root"
          @update:model-value="onContextFileChange"
        />
      </div>
      <label class="project-pane__toggle">
        <input v-model="form.workspace_write" type="checkbox" @change="onChange" />
        <span>{{ t("configure.project.workspaceWrite") }}</span>
      </label>
      <label class="project-pane__toggle">
        <input v-model="form.human_manual_review" type="checkbox" @change="onChange" />
        <span>{{ t("configure.project.humanManualReview") }}</span>
      </label>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import FilePathPicker from "@/shared/components/FilePathPicker.vue";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useI18n } from "@/shared/lib/i18n";

const settings = useInjectedAppSettings();
const { t } = useI18n();

const form = computed(() => settings.form);

function onChange(): void {
  settings.saveSettingsSoon();
}

function onWorkspaceRootChange(value: string): void {
  settings.form.workspace_root = value;
  onChange();
}

function onContextFileChange(value: string): void {
  settings.form.project_context_file = value;
  onChange();
}
</script>

<style scoped>
.project-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-pane__banner,
.project-pane__form {
  max-width: 720px;
}

.project-pane__banner {
  margin: 0;
  padding: 10px 14px;
  background: var(--accent-soft);
  color: var(--accent-2);
  border-radius: var(--r-md);
  font-size: 12px;
}

.project-pane__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.project-pane__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.project-pane__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2);
}

.project-pane__input {
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

.project-pane__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.project-pane__toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--ink-2);
  cursor: pointer;
}

.project-pane__toggle input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}
</style>
