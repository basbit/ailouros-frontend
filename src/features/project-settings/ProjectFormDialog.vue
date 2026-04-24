<template>
  <Teleport to="body">
    <Transition name="project-form__overlay">
      <div
        v-if="open"
        class="project-form__backdrop"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @mousedown.self="onCancel"
      >
        <div class="project-form__dialog" @mousedown.stop>
          <header class="project-form__header">
            <h2 class="project-form__title">{{ title }}</h2>
            <button
              type="button"
              class="project-form__close"
              :aria-label="t('dialogs.cancel')"
              @click="onCancel"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>

          <form class="project-form__body" @submit.prevent="onSave">
            <!-- ── Basics ─────────────────────────────────────── -->
            <section class="project-form__section">
              <div class="field">
                <label class="field-label" for="pf-name">
                  {{ t("projectForm.name") }}
                </label>
                <input
                  id="pf-name"
                  ref="nameEl"
                  v-model="form.name"
                  type="text"
                  :placeholder="t('projectForm.namePlaceholder')"
                  required
                  @keydown.escape.prevent="onCancel"
                />
              </div>

              <div class="field">
                <label class="field-label" for="pf-root">workspace_root</label>
                <input
                  id="pf-root"
                  v-model="form.workspace_root"
                  type="text"
                  placeholder="/absolute/path/to/repo"
                  @keydown.escape.prevent="onCancel"
                />
                <div class="hint project-form__hint">
                  {{ t("projectForm.rootHint") }}
                </div>
              </div>

              <div class="field">
                <label class="field-label" for="pf-ctx">
                  project_context_file
                  <span class="project-form__optional">
                    ({{ t("workspace.optional") }})
                  </span>
                </label>
                <input
                  id="pf-ctx"
                  v-model="form.project_context_file"
                  type="text"
                  placeholder="docs/PROJECT_CONTEXT.md"
                  @keydown.escape.prevent="onCancel"
                />
              </div>

              <div class="field">
                <label class="checkbox-row">
                  <input id="pf-write" v-model="form.workspace_write" type="checkbox" />
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
                  capabilities.workspace_write
                    ? t("workspace.allowed")
                    : t("workspace.forbidden")
                }}
                · {{ t("workspace.shellLabel") }}
                {{
                  capabilities.command_exec
                    ? t("workspace.allowed")
                    : t("workspace.forbidden")
                }}
              </div>
            </section>

            <!-- ── Languages & docs ───────────────────────────── -->
            <details class="project-form__group">
              <summary>{{ t("projectForm.sections.languages") }}</summary>
              <div class="project-form__group-body">
                <div class="field">
                  <label class="field-label" for="pf-languages">{{
                    t("swarm.languagesLabel")
                  }}</label>
                  <input
                    id="pf-languages"
                    v-model="form.swarm_languages"
                    type="text"
                    placeholder="python, go, typescript"
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
                    v-model="form.swarm_doc_locale"
                    type="text"
                    placeholder="ru"
                  />
                </div>

                <div class="field">
                  <label class="field-label" for="pf-doc-sources">{{
                    t("swarm.docSourcesLabel")
                  }}</label>
                  <textarea
                    id="pf-doc-sources"
                    v-model="form.swarm_documentation_sources"
                    rows="4"
                    placeholder="https://… one per line"
                  ></textarea>
                  <div class="hint project-form__hint">
                    {{ t("swarm.docSourcesHint") }}
                  </div>
                </div>
              </div>
            </details>

            <!-- ── Memory ─────────────────────────────────────── -->
            <details class="project-form__group">
              <summary>{{ t("projectForm.sections.memory") }}</summary>
              <div class="project-form__group-body">
                <div class="field">
                  <label class="checkbox-row">
                    <input
                      id="pf-pattern-memory"
                      v-model="form.swarm_pattern_memory"
                      type="checkbox"
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
                    v-model="form.swarm_memory_namespace"
                    type="text"
                    placeholder="default"
                  />
                  <div class="hint project-form__hint">
                    {{ t("swarm.memoryNamespaceHint") }}
                  </div>
                </div>

                <div class="field">
                  <label class="field-label" for="pf-pattern-path">{{
                    t("swarm.patternFileLabel")
                  }}</label>
                  <input
                    id="pf-pattern-path"
                    v-model="form.swarm_pattern_memory_path"
                    type="text"
                    placeholder=".swarm/pattern-memory.json"
                  />
                  <div class="hint project-form__hint">
                    {{ t("swarm.patternFileHint") }}
                  </div>
                </div>
              </div>
            </details>

            <!-- ── MCP servers ────────────────────────────────── -->
            <details class="project-form__group">
              <summary>{{ t("projectForm.sections.mcp") }}</summary>
              <div class="project-form__group-body">
                <McpSettings :form="mcpSlice" @update:form="onFieldUpdate" />
              </div>
            </details>

            <!-- ── Database ───────────────────────────────────── -->
            <details class="project-form__group">
              <summary>{{ t("projectForm.sections.database") }}</summary>
              <div class="project-form__group-body">
                <DatabaseSettings :form="dbSlice" @update:form="onFieldUpdate" />
              </div>
            </details>

            <!-- ── Advanced ───────────────────────────────────── -->
            <details class="project-form__group">
              <summary>{{ t("projectForm.sections.advanced") }}</summary>
              <div class="project-form__group-body">
                <div class="field">
                  <label class="field-label" for="pf-hooks">{{
                    t("swarm.hooksLabel")
                  }}</label>
                  <input
                    id="pf-hooks"
                    v-model="form.swarm_pipeline_hooks_module"
                    type="text"
                    placeholder="my_package.swarm_hooks"
                  />
                  <div class="hint project-form__hint">{{ t("swarm.hooksHint") }}</div>
                </div>

                <div class="field">
                  <label class="checkbox-row">
                    <input
                      id="pf-disable-tree"
                      v-model="form.swarm_disable_tree_sitter"
                      type="checkbox"
                    />
                    <span class="check-label">{{ t("swarm.disableTreeLabel") }}</span>
                  </label>
                </div>
              </div>
            </details>

            <footer class="project-form__actions">
              <button type="button" class="btn-secondary" @click="onCancel">
                {{ t("dialogs.cancel") }}
              </button>
              <button type="submit" class="btn-primary" :disabled="!form.name.trim()">
                {{
                  mode === "create" ? t("projectForm.create") : t("projectForm.save")
                }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import McpSettings from "@/features/swarm-settings/McpSettings.vue";
import DatabaseSettings from "@/features/swarm-settings/DatabaseSettings.vue";

export interface ProjectFormValues {
  name: string;
  workspace_root: string;
  project_context_file: string;
  workspace_write: boolean;
  // Advanced (project-scoped) — former Swarm / MCP / Database block.
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
}

const DEFAULT_VALUES: ProjectFormValues = {
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
};

const props = defineProps<{
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<ProjectFormValues>;
  capabilities: { workspace_write?: boolean; command_exec?: boolean } | null;
}>();

const emit = defineEmits<{
  "update:open": [val: boolean];
  submit: [values: ProjectFormValues];
}>();

const { t } = useI18n();

const form = reactive<ProjectFormValues>({ ...DEFAULT_VALUES });
const nameEl = ref<HTMLInputElement | null>(null);

const title = computed(() =>
  props.mode === "create" ? t("projectForm.titleCreate") : t("projectForm.titleEdit"),
);

const capsWarn = computed(
  () =>
    !!props.capabilities && form.workspace_write && !props.capabilities.workspace_write,
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

function onFieldUpdate(field: string, value: string): void {
  // Sub-components emit string-coerced values. Convert booleans back for
  // checkbox fields.
  const boolFields = new Set([
    "swarm_mcp_auto",
    "swarm_skip_mcp_tools",
    "swarm_database_readonly",
  ]);
  if (!(field in form)) return;
  if (boolFields.has(field)) {
    (form as Record<string, unknown>)[field] = value === "true";
  } else {
    (form as Record<string, unknown>)[field] = value;
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return;
    Object.assign(form, DEFAULT_VALUES, props.initial ?? {});
    nextTick(() => nameEl.value?.focus());
  },
  { immediate: true },
);

function onCancel(): void {
  emit("update:open", false);
}

function onSave(): void {
  const name = form.name.trim();
  if (!name) return;
  emit("submit", {
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
  });
}
</script>

<style scoped>
.project-form__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 8, 6, 0.54);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 400;
}

.project-form__dialog {
  width: min(560px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
}

.project-form__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--surface);
  z-index: 1;
}
.project-form__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}
.project-form__close {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text3);
  padding: 4px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s,
    color 0.15s;
}
.project-form__close:hover {
  background: var(--surface2);
  color: var(--text);
}

.project-form__body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.project-form__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.project-form__hint {
  font-size: 11px;
  color: var(--text3);
  margin-top: 4px;
  line-height: 1.45;
}
.project-form__optional {
  opacity: 0.6;
  font-weight: 400;
  font-size: 11px;
  margin-left: 4px;
}
.project-form__group {
  border-top: 1px solid var(--border);
  padding-top: 8px;
}
.project-form__group > summary {
  cursor: pointer;
  list-style: none;
  padding: 6px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text2);
  display: flex;
  align-items: center;
  gap: 6px;
  user-select: none;
}
.project-form__group > summary::-webkit-details-marker {
  display: none;
}
.project-form__group > summary::before {
  content: "›";
  display: inline-block;
  font-size: 14px;
  color: var(--text3);
  transition: transform 0.15s ease;
  flex-shrink: 0;
}
.project-form__group[open] > summary::before {
  transform: rotate(90deg);
}
.project-form__group-body {
  padding: 6px 0 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.project-form__caps {
  font-size: 11px;
  padding: 8px 10px;
  border-radius: var(--radius);
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--text2);
}
.project-form__caps--warn {
  color: var(--error);
  border-color: color-mix(in srgb, var(--error) 35%, transparent);
  background: color-mix(in srgb, var(--error) 8%, transparent);
}

.project-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
  position: sticky;
  bottom: 0;
  background: var(--surface);
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.project-form__overlay-enter-active,
.project-form__overlay-leave-active {
  transition: opacity 0.16s var(--ease-spring);
}
.project-form__overlay-enter-active .project-form__dialog,
.project-form__overlay-leave-active .project-form__dialog {
  transition:
    transform 0.18s var(--ease-spring),
    opacity 0.18s var(--ease-spring);
}
.project-form__overlay-enter-from,
.project-form__overlay-leave-to {
  opacity: 0;
}
.project-form__overlay-enter-from .project-form__dialog,
.project-form__overlay-leave-to .project-form__dialog {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
</style>
