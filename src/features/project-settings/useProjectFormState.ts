/**
 * useProjectFormState — reactive form, defaults, slices, submit normalization.
 * Extracted from ProjectFormDialog.vue (plan §20.1.2) — no behaviour change.
 */
import { computed, nextTick, reactive, ref, watch, type Ref } from "vue";

export interface ProjectFormValues {
  name: string;
  workspace_root: string;
  project_context_file: string;
  workspace_write: boolean;
  swarm_languages: string;
  swarm_doc_locale: string;
  swarm_documentation_sources: string;
  swarm_pattern_memory: boolean;
  swarm_memory_namespace: string;
  swarm_pattern_memory_path: string;
  swarm_pipeline_hooks_module: string;
  swarm_disable_tree_sitter: boolean;
  swarm_mcp_auto: boolean;
  swarm_skip_mcp_tools: boolean;
  mcp_servers_json: string;
  swarm_database_url: string;
  swarm_database_hint: string;
  swarm_database_readonly: boolean;
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
}

export const DEFAULT_PROJECT_FORM_VALUES: ProjectFormValues = {
  name: "",
  workspace_root: "",
  project_context_file: "",
  workspace_write: false,
  swarm_languages: "",
  swarm_doc_locale: "",
  swarm_documentation_sources: "",
  swarm_pattern_memory: false,
  swarm_memory_namespace: "",
  swarm_pattern_memory_path: "",
  swarm_pipeline_hooks_module: "",
  swarm_disable_tree_sitter: false,
  swarm_mcp_auto: true,
  swarm_skip_mcp_tools: false,
  mcp_servers_json: "",
  swarm_database_url: "",
  swarm_database_hint: "",
  swarm_database_readonly: true,
  swarm_visual_probe_enabled: true,
  swarm_visual_base_url: "",
  swarm_visual_start_command: "",
  swarm_visual_start_directory: "",
  swarm_visual_ready_path: "/",
  swarm_visual_pages: "/",
  swarm_visual_capture_har: false,
  swarm_visual_capture_trace: false,
  swarm_visual_multimodal_review: false,
  swarm_visual_max_review_images: "4",
};

interface UseProjectFormStateOptions {
  open: Ref<boolean>;
  initial: Ref<Partial<ProjectFormValues> | undefined>;
  capabilities: Ref<{ workspace_write?: boolean; command_exec?: boolean } | null>;
}

export function useProjectFormState(opts: UseProjectFormStateOptions) {
  const form = reactive<ProjectFormValues>({ ...DEFAULT_PROJECT_FORM_VALUES });
  const nameEl = ref<HTMLInputElement | null>(null);

  const capsWarn = computed(
    () =>
      !!opts.capabilities.value &&
      form.workspace_write &&
      !opts.capabilities.value.workspace_write,
  );

  const mcpSlice = computed(() => ({
    swarm_mcp_auto: form.swarm_mcp_auto,
    swarm_skip_mcp_tools: form.swarm_skip_mcp_tools,
    mcp_servers_json: form.mcp_servers_json,
  }));

  const dbSlice = computed(() => ({
    swarm_database_url: form.swarm_database_url,
    swarm_database_hint: form.swarm_database_hint,
    swarm_database_readonly: form.swarm_database_readonly,
  }));

  const visualSlice = computed(() => ({
    swarm_visual_probe_enabled: form.swarm_visual_probe_enabled,
    swarm_visual_base_url: form.swarm_visual_base_url,
    swarm_visual_start_command: form.swarm_visual_start_command,
    swarm_visual_start_directory: form.swarm_visual_start_directory,
    swarm_visual_ready_path: form.swarm_visual_ready_path,
    swarm_visual_pages: form.swarm_visual_pages,
    swarm_visual_capture_har: form.swarm_visual_capture_har,
    swarm_visual_capture_trace: form.swarm_visual_capture_trace,
    swarm_visual_multimodal_review: form.swarm_visual_multimodal_review,
    swarm_visual_max_review_images: form.swarm_visual_max_review_images,
  }));

  function onFieldUpdate(field: string, value: string): void {
    const boolFields = new Set([
      "swarm_mcp_auto",
      "swarm_skip_mcp_tools",
      "swarm_database_readonly",
      "swarm_visual_probe_enabled",
      "swarm_visual_capture_har",
      "swarm_visual_capture_trace",
      "swarm_visual_multimodal_review",
    ]);
    if (!(field in form)) return;
    if (boolFields.has(field)) {
      (form as Record<string, unknown>)[field] = value === "true";
    } else {
      (form as Record<string, unknown>)[field] = value;
    }
  }

  watch(
    () => opts.open.value,
    (isOpen) => {
      if (!isOpen) return;
      Object.assign(form, DEFAULT_PROJECT_FORM_VALUES, opts.initial.value ?? {});
      nextTick(() => nameEl.value?.focus());
    },
    { immediate: true },
  );

  function buildSubmitPayload(): ProjectFormValues | null {
    const name = form.name.trim();
    if (!name) return null;
    return {
      ...form,
      name,
      workspace_root: form.workspace_root.trim(),
      project_context_file: form.project_context_file.trim(),
      swarm_languages: form.swarm_languages.trim(),
      swarm_doc_locale: form.swarm_doc_locale.trim(),
      swarm_documentation_sources: form.swarm_documentation_sources,
      swarm_memory_namespace: form.swarm_memory_namespace.trim(),
      swarm_pattern_memory_path: form.swarm_pattern_memory_path.trim(),
      swarm_pipeline_hooks_module: form.swarm_pipeline_hooks_module.trim(),
      mcp_servers_json: form.mcp_servers_json,
      swarm_database_url: form.swarm_database_url.trim(),
      swarm_database_hint: form.swarm_database_hint.trim(),
      swarm_visual_base_url: form.swarm_visual_base_url.trim(),
      swarm_visual_start_command: form.swarm_visual_start_command.trim(),
      swarm_visual_start_directory: form.swarm_visual_start_directory.trim(),
      swarm_visual_ready_path: form.swarm_visual_ready_path.trim() || "/",
      swarm_visual_pages: form.swarm_visual_pages.trim() || "/",
      swarm_visual_max_review_images: form.swarm_visual_max_review_images.trim() || "4",
    };
  }

  return {
    form,
    nameEl,
    capsWarn,
    mcpSlice,
    dbSlice,
    visualSlice,
    onFieldUpdate,
    buildSubmitPayload,
  };
}
