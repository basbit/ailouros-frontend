<template>
  <details class="project-form__group">
    <summary>{{ t("projectForm.sections.languages") }}</summary>
    <div class="project-form__group-body">
      <div class="field">
        <label class="field-label" for="pf-languages">{{
          t("swarm.languagesLabel")
        }}</label>
        <input
          id="pf-languages"
          :value="form.swarm_languages"
          type="text"
          placeholder="python, go, typescript"
          @input="onTextInput('swarm_languages', $event)"
        />
        <div class="hint project-form__hint">
          {{ t("swarm.languagesHint") }}
        </div>
      </div>

      <div class="field">
        <label class="field-label" for="pf-doc-locale">{{
          t("swarm.docLocaleLabel")
        }}</label>
        <input
          id="pf-doc-locale"
          :value="form.swarm_doc_locale"
          type="text"
          placeholder="ru"
          @input="onTextInput('swarm_doc_locale', $event)"
        />
      </div>

      <div class="field">
        <label class="field-label" for="pf-doc-sources">{{
          t("swarm.docSourcesLabel")
        }}</label>
        <textarea
          id="pf-doc-sources"
          :value="form.swarm_documentation_sources"
          rows="4"
          placeholder="https://… one per line"
          @input="onTextInput('swarm_documentation_sources', $event)"
        ></textarea>
        <div class="hint project-form__hint">
          {{ t("swarm.docSourcesHint") }}
        </div>
      </div>
    </div>
  </details>

  <details class="project-form__group">
    <summary>{{ t("projectForm.sections.memory") }}</summary>
    <div class="project-form__group-body">
      <div class="field">
        <label class="checkbox-row">
          <input
            id="pf-pattern-memory"
            :checked="form.swarm_pattern_memory"
            type="checkbox"
            @change="onBoolInput('swarm_pattern_memory', $event)"
          />
          <span class="check-label">{{ t("swarm.patternMemoryLabel") }}</span>
        </label>
        <div class="hint project-form__hint">
          {{ t("swarm.patternMemoryHint") }}
        </div>
      </div>

      <div class="field">
        <label class="field-label" for="pf-memory-namespace">{{
          t("swarm.memoryNamespaceLabel")
        }}</label>
        <input
          id="pf-memory-namespace"
          :value="form.swarm_memory_namespace"
          type="text"
          placeholder="default"
          @input="onTextInput('swarm_memory_namespace', $event)"
        />
        <div class="hint project-form__hint">
          {{ t("swarm.memoryNamespaceHint") }}
        </div>
      </div>

      <div class="field">
        <label class="field-label" for="pf-pattern-path">{{
          t("swarm.patternFileLabel")
        }}</label>
        <FilePathPicker
          :model-value="form.swarm_pattern_memory_path"
          placeholder=".swarm/pattern-memory.json"
          :file-extensions="['json', 'jsonl']"
          :default-path="form.workspace_root"
          @update:model-value="
            (value) => emit('update:field', 'swarm_pattern_memory_path', value)
          "
        />
        <div class="hint project-form__hint">
          {{ t("swarm.patternFileHint") }}
        </div>
      </div>
    </div>
  </details>

  <details class="project-form__group">
    <summary>{{ t("projectForm.sections.mcp") }}</summary>
    <div class="project-form__group-body">
      <McpSettings :form="mcpSlice" @update:form="onChildUpdate" />
    </div>
  </details>

  <details class="project-form__group">
    <summary>{{ t("projectForm.sections.database") }}</summary>
    <div class="project-form__group-body">
      <DatabaseSettings :form="dbSlice" @update:form="onChildUpdate" />
    </div>
  </details>

  <details class="project-form__group">
    <summary>{{ t("projectForm.sections.visualQa") }}</summary>
    <div class="project-form__group-body">
      <VisualProbeSettings :form="visualSlice" @update:form="onChildUpdate" />
    </div>
  </details>

  <details class="project-form__group">
    <summary>{{ t("projectForm.sections.advanced") }}</summary>
    <div class="project-form__group-body">
      <div class="field">
        <label class="field-label" for="pf-hooks">{{ t("swarm.hooksLabel") }}</label>
        <input
          id="pf-hooks"
          :value="form.swarm_pipeline_hooks_module"
          type="text"
          placeholder="my_package.swarm_hooks"
          @input="onTextInput('swarm_pipeline_hooks_module', $event)"
        />
        <div class="hint project-form__hint">{{ t("swarm.hooksHint") }}</div>
      </div>

      <div class="field">
        <label class="checkbox-row">
          <input
            id="pf-disable-tree"
            :checked="form.swarm_disable_tree_sitter"
            type="checkbox"
            @change="onBoolInput('swarm_disable_tree_sitter', $event)"
          />
          <span class="check-label">{{ t("swarm.disableTreeLabel") }}</span>
        </label>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";
import McpSettings from "@/features/project-settings/McpSettings.vue";
import DatabaseSettings from "@/features/project-settings/DatabaseSettings.vue";
import VisualProbeSettings from "@/features/project-settings/VisualProbeSettings.vue";
import FilePathPicker from "@/shared/components/FilePathPicker.vue";
import type { ProjectFormValues } from "./useProjectFormState";

defineProps<{
  form: ProjectFormValues;
  mcpSlice: {
    swarm_mcp_auto: boolean;
    swarm_skip_mcp_tools: boolean;
    mcp_servers_json: string;
  };
  dbSlice: {
    swarm_database_url: string;
    swarm_database_hint: string;
    swarm_database_readonly: boolean;
  };
  visualSlice: {
    swarm_visual_probe_enabled: boolean;
    swarm_visual_base_url: string;
    swarm_visual_start_command: string;
    swarm_visual_start_directory: string;
    swarm_visual_ready_path: string;
    swarm_visual_pages: string;
    swarm_visual_capture_har: boolean;
    swarm_visual_capture_trace: boolean;
    swarm_visual_multimodal_review: boolean;
    swarm_visual_max_review_images: string;
  };
}>();

const emit = defineEmits<{
  "update:field": [field: keyof ProjectFormValues, value: string | boolean];
  "update:child-field": [field: string, value: string];
}>();

const { t } = useI18n();

function onTextInput(field: keyof ProjectFormValues, ev: Event): void {
  const target = ev.target as HTMLInputElement | HTMLTextAreaElement;
  emit("update:field", field, target.value);
}

function onBoolInput(field: keyof ProjectFormValues, ev: Event): void {
  const target = ev.target as HTMLInputElement;
  emit("update:field", field, target.checked);
}

function onChildUpdate(field: string, value: string): void {
  emit("update:child-field", field, value);
}
</script>
