<template>
  <section class="project-form__section">
    <div class="field">
      <label class="field-label" for="pf-name">
        {{ t("projectForm.name") }}
      </label>
      <input
        id="pf-name"
        ref="nameRef"
        :value="form.name"
        type="text"
        :placeholder="t('projectForm.namePlaceholder')"
        required
        @input="onTextInput('name', $event)"
        @keydown.escape.prevent="$emit('cancel')"
      />
    </div>

    <div class="field">
      <label class="field-label" for="pf-root">workspace_root</label>
      <div class="project-form__path-row">
        <input
          id="pf-root"
          :value="form.workspace_root"
          type="text"
          placeholder="/absolute/path/to/repo"
          @input="onTextInput('workspace_root', $event)"
          @keydown.escape.prevent="$emit('cancel')"
        />
        <button
          v-if="isDesktopShell"
          type="button"
          class="project-form__pick-btn"
          :title="t('projectForm.pickFolder')"
          @click="onPickWorkspaceRoot"
        >
          📁
        </button>
      </div>
      <div class="hint project-form__hint">
        {{ t("projectForm.rootHint") }}
      </div>
    </div>

    <div class="field">
      <label class="field-label" for="pf-ctx">
        project_context_file
        <span class="project-form__optional"> ({{ t("workspace.optional") }}) </span>
      </label>
      <input
        id="pf-ctx"
        :value="form.project_context_file"
        type="text"
        placeholder="docs/PROJECT_CONTEXT.md"
        @input="onTextInput('project_context_file', $event)"
        @keydown.escape.prevent="$emit('cancel')"
      />
    </div>

    <div class="field">
      <label class="checkbox-row">
        <input
          id="pf-write"
          :checked="form.workspace_write"
          type="checkbox"
          @change="onBoolInput('workspace_write', $event)"
        />
        <span class="check-label">{{ t("projectForm.writeLabel") }}</span>
      </label>
      <div class="hint project-form__hint">
        {{ t("projectForm.writeHint") }}
        <code>SWARM_ALLOW_WORKSPACE_WRITE=1</code>
      </div>
    </div>

    <div
      v-if="capabilities"
      class="project-form__caps"
      :class="{ 'project-form__caps--warn': capsWarn }"
    >
      {{ t("workspace.serverLabel") }}
      {{
        capabilities.workspace_write ? t("workspace.allowed") : t("workspace.forbidden")
      }}
      · {{ t("workspace.shellLabel") }}
      {{
        capabilities.command_exec ? t("workspace.allowed") : t("workspace.forbidden")
      }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { isDesktop } from "@/shared/lib/desktop-bridge";
import type { ProjectFormValues } from "./useProjectFormState";

const props = defineProps<{
  form: ProjectFormValues;
  capabilities: { workspace_write?: boolean; command_exec?: boolean } | null;
  capsWarn: boolean;
}>();

const emit = defineEmits<{
  "update:field": [field: keyof ProjectFormValues, value: string | boolean];
  cancel: [];
  "name-input-ref": [el: HTMLInputElement | null];
}>();

const { t } = useI18n();
const isDesktopShell = isDesktop();
const nameRef = ref<HTMLInputElement | null>(null);

watch(
  nameRef,
  (el) => {
    emit("name-input-ref", el);
  },
  { immediate: true },
);

function onTextInput(field: keyof ProjectFormValues, ev: Event): void {
  const target = ev.target as HTMLInputElement;
  emit("update:field", field, target.value);
}

function onBoolInput(field: keyof ProjectFormValues, ev: Event): void {
  const target = ev.target as HTMLInputElement;
  emit("update:field", field, target.checked);
}

async function onPickWorkspaceRoot(): Promise<void> {
  if (!isDesktopShell) return;
  try {
    const dialog = await import("@tauri-apps/plugin-dialog");
    const selected = await dialog.open({
      directory: true,
      multiple: false,
      title: t("projectForm.pickFolder"),
    });
    if (typeof selected === "string" && selected) {
      emit("update:field", "workspace_root", selected);
    }
  } catch (error) {
    console.error("folder picker failed", error);
  }
}

// Silence unused-prop lint warnings — these are used in the template.
void props;
</script>
