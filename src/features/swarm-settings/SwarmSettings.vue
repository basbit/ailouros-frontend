<template>
  <details class="section">
    <summary>{{ t("swarm.summary") }}</summary>
    <div class="section-body">
      <div class="field">
        <label class="field-label" for="swarm_languages">{{
          t("swarm.languagesLabel")
        }}</label>
        <input
          id="swarm_languages"
          type="text"
          placeholder="python, go, typescript"
          :value="form.swarm_languages"
          @input="
            emit(
              'update:form',
              'swarm_languages',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
        <div class="hint">{{ t("swarm.languagesHint") }}</div>
      </div>

      <div class="field">
        <label class="checkbox-row">
          <input
            id="swarm_pattern_memory"
            type="checkbox"
            :checked="form.swarm_pattern_memory"
            @change="
              emit(
                'update:form',
                'swarm_pattern_memory',
                String(($event.target as HTMLInputElement).checked),
              )
            "
          />
          <span class="check-label">{{ t("swarm.patternMemoryLabel") }}</span>
        </label>
        <div class="hint">{{ t("swarm.patternMemoryHint") }}</div>
      </div>

      <div class="field">
        <label class="field-label" for="swarm_memory_namespace">{{
          t("swarm.memoryNamespaceLabel")
        }}</label>
        <input
          id="swarm_memory_namespace"
          type="text"
          placeholder="default"
          :value="form.swarm_memory_namespace"
          @input="
            emit(
              'update:form',
              'swarm_memory_namespace',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
        <div class="hint">{{ t("swarm.memoryNamespaceHint") }}</div>
      </div>

      <div class="field">
        <label class="field-label" for="swarm_pattern_memory_path">{{
          t("swarm.patternFileLabel")
        }}</label>
        <input
          id="swarm_pattern_memory_path"
          type="text"
          placeholder=".swarm/pattern-memory.json"
          :value="form.swarm_pattern_memory_path"
          @input="
            emit(
              'update:form',
              'swarm_pattern_memory_path',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
        <div class="hint">{{ t("swarm.patternFileHint") }}</div>
      </div>

      <div class="field">
        <label class="field-label" for="swarm_pipeline_hooks_module">{{
          t("swarm.hooksLabel")
        }}</label>
        <input
          id="swarm_pipeline_hooks_module"
          type="text"
          placeholder="my_package.swarm_hooks"
          :value="form.swarm_pipeline_hooks_module"
          @input="
            emit(
              'update:form',
              'swarm_pipeline_hooks_module',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
        <div class="hint">{{ t("swarm.hooksHint") }}</div>
      </div>

      <div class="field">
        <label class="field-label" for="swarm_doc_locale">{{
          t("swarm.docLocaleLabel")
        }}</label>
        <input
          id="swarm_doc_locale"
          type="text"
          placeholder="ru"
          :value="form.swarm_doc_locale"
          @input="
            emit(
              'update:form',
              'swarm_doc_locale',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </div>

      <div class="field">
        <label class="field-label" for="swarm_documentation_sources">{{
          t("swarm.docSourcesLabel")
        }}</label>
        <textarea
          id="swarm_documentation_sources"
          rows="5"
          :value="form.swarm_documentation_sources"
          placeholder="https://… one per line, or:&#10;Title | https://…&#10;Title | short note | https://…&#10;# comments start with #"
          @input="
            emit(
              'update:form',
              'swarm_documentation_sources',
              ($event.target as HTMLTextAreaElement).value,
            )
          "
        ></textarea>
        <div class="hint">{{ t("swarm.docSourcesHint") }}</div>
      </div>

      <div class="field">
        <label class="checkbox-row">
          <input
            id="swarm_disable_tree_sitter"
            type="checkbox"
            :checked="form.swarm_disable_tree_sitter"
            @change="
              emit(
                'update:form',
                'swarm_disable_tree_sitter',
                String(($event.target as HTMLInputElement).checked),
              )
            "
          />
          <span class="check-label">{{ t("swarm.disableTreeLabel") }}</span>
        </label>
      </div>

      <McpSettings :form="mcpSlice" @update:form="forwardUpdate" />

      <DatabaseSettings :form="dbSlice" @update:form="forwardUpdate" />
    </div>
  </details>

  <!-- Automation & Quality -->
  <details class="section">
    <summary>{{ t("swarm.automationSummary") }}</summary>
    <div class="section-body">
      <AutonomousSettings :form="autonomousSlice" @update:form="forwardUpdate" />
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed } from "vue";
import McpSettings from "./McpSettings.vue";
import DatabaseSettings from "./DatabaseSettings.vue";
import AutonomousSettings from "./AutonomousSettings.vue";
import { useI18n } from "@/shared/lib/i18n";

interface FormSlice {
  swarm_topology: string;
  swarm_languages: string;
  swarm_pattern_memory: boolean;
  swarm_pipeline_hooks_module: string;
  swarm_mcp_auto: boolean;
  swarm_skip_mcp_tools: boolean;
  swarm_doc_locale: string;
  swarm_documentation_sources: string;
  swarm_database_url: string;
  swarm_database_hint: string;
  swarm_database_readonly: boolean;
  swarm_disable_tree_sitter: boolean;
  mcp_servers_json: string;
  swarm_brave_search_api_key: string;
  // Automation & Quality
  swarm_self_verify: boolean;
  swarm_self_verify_model: string;
  swarm_self_verify_provider: string;
  swarm_auto_approve: string;
  swarm_auto_approve_timeout: string;
  swarm_auto_retry: boolean;
  swarm_max_step_retries: string;
  swarm_deep_planning: boolean;
  swarm_deep_planning_model: string;
  swarm_deep_planning_provider: string;
  swarm_background_agent: boolean;
  swarm_background_watch_paths: string;
  swarm_dream_enabled: boolean;
  swarm_quality_gate: boolean;
  swarm_auto_plan: boolean;
  swarm_planner_model: string;
  swarm_planner_provider: string;
  swarm_memory_namespace: string;
  swarm_pattern_memory_path: string;
  swarm_force_rerun: boolean;
}

const props = defineProps<{ form: FormSlice }>();

const emit = defineEmits<{
  "update:form": [field: string, value: string];
}>();
const { t } = useI18n();

const mcpSlice = computed(() => ({
  swarm_mcp_auto: props.form.swarm_mcp_auto,
  swarm_skip_mcp_tools: props.form.swarm_skip_mcp_tools,
  mcp_servers_json: props.form.mcp_servers_json,
  swarm_brave_search_api_key: props.form.swarm_brave_search_api_key,
}));

const dbSlice = computed(() => ({
  swarm_database_url: props.form.swarm_database_url,
  swarm_database_hint: props.form.swarm_database_hint,
  swarm_database_readonly: props.form.swarm_database_readonly,
}));

function forwardUpdate(field: string, value: string): void {
  emit("update:form", field, value);
}

const autonomousSlice = computed(() => ({
  swarm_topology: props.form.swarm_topology,
  swarm_self_verify: props.form.swarm_self_verify,
  swarm_self_verify_model: props.form.swarm_self_verify_model,
  swarm_self_verify_provider: props.form.swarm_self_verify_provider,
  swarm_auto_approve: props.form.swarm_auto_approve,
  swarm_auto_approve_timeout: props.form.swarm_auto_approve_timeout,
  swarm_auto_retry: props.form.swarm_auto_retry,
  swarm_max_step_retries: props.form.swarm_max_step_retries,
  swarm_deep_planning: props.form.swarm_deep_planning,
  swarm_deep_planning_model: props.form.swarm_deep_planning_model,
  swarm_deep_planning_provider: props.form.swarm_deep_planning_provider,
  swarm_background_agent: props.form.swarm_background_agent,
  swarm_background_watch_paths: props.form.swarm_background_watch_paths,
  swarm_dream_enabled: props.form.swarm_dream_enabled,
  swarm_quality_gate: props.form.swarm_quality_gate,
  swarm_auto_plan: props.form.swarm_auto_plan,
  swarm_planner_model: props.form.swarm_planner_model,
  swarm_planner_provider: props.form.swarm_planner_provider,
  swarm_force_rerun: props.form.swarm_force_rerun,
}));
</script>
