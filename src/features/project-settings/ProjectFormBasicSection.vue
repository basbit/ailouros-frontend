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
      <FilePathPicker
        :model-value="form.workspace_root"
        placeholder="/absolute/path/to/repo"
        :directory="true"
        :picker-title="t('projectForm.pickFolder')"
        @update:model-value="(value) => emit('update:field', 'workspace_root', value)"
      />
      <div class="hint project-form__hint">
        {{ t("projectForm.rootHint") }}
      </div>
    </div>

    <div class="field">
      <label class="field-label" for="pf-ctx">
        project_context_file
        <span class="project-form__optional"> ({{ t("workspace.optional") }}) </span>
      </label>
      <FilePathPicker
        :model-value="form.project_context_file"
        placeholder="docs/PROJECT_CONTEXT.md"
        :file-extensions="['md', 'markdown', 'txt']"
        :default-path="form.workspace_root"
        @update:model-value="
          (value) => emit('update:field', 'project_context_file', value)
        "
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
import FilePathPicker from "@/shared/components/FilePathPicker.vue";
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

void props;
</script>
