<template>
  <section class="advanced-pane">
    <PaneHeader
      :title="t('configure.advanced.title')"
      :subtitle="t('configure.advanced.subtitle')"
    >
      <template #actions>
        <input
          v-model="query"
          type="search"
          class="advanced-pane__search"
          :placeholder="t('configure.advanced.searchPlaceholder')"
        />
      </template>
    </PaneHeader>

    <p class="advanced-pane__banner">{{ t("configure.apiKeysBanner") }}</p>

    <div v-if="!hasMatches" class="advanced-pane__empty">
      {{ t("configure.advanced.empty") }}
    </div>

    <div v-for="group in visibleGroups" :key="group.id" class="advanced-pane__group">
      <h3 class="advanced-pane__group-title">
        {{ t(group.titleKey) }}
      </h3>
      <div class="advanced-pane__rows">
        <div v-for="field in group.fields" :key="field.id" class="advanced-pane__row">
          <label class="advanced-pane__field-label" :for="field.id">
            <span class="advanced-pane__field-id">{{ field.id }}</span>
          </label>
          <template v-if="field.kind === 'boolean'">
            <input
              :id="field.id"
              v-model="form[field.id] as boolean"
              type="checkbox"
              class="advanced-pane__checkbox"
              @change="onChange"
            />
          </template>
          <template v-else>
            <input
              :id="field.id"
              v-model="form[field.id] as string"
              :type="field.kind === 'number' ? 'text' : 'text'"
              class="advanced-pane__input"
              :placeholder="field.placeholder"
              @input="onChange"
            />
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useI18n } from "@/shared/lib/i18n";

const settings = useInjectedAppSettings();
const { t } = useI18n();

type FieldKind = "string" | "boolean" | "number";

interface FieldDef {
  id: keyof typeof settings.form;
  kind: FieldKind;
  placeholder?: string;
}

interface GroupDef {
  id: string;
  titleKey: string;
  fields: FieldDef[];
}

const GROUPS: GroupDef[] = [
  {
    id: "memory",
    titleKey: "configure.advanced.groups.memory",
    fields: [
      { id: "swarm_pattern_memory", kind: "boolean" },
      {
        id: "swarm_pattern_memory_path",
        kind: "string",
        placeholder: ".swarm/patterns",
      },
      { id: "swarm_memory_namespace", kind: "string" },
      { id: "swarm_documentation_sources", kind: "string" },
      { id: "swarm_doc_locale", kind: "string", placeholder: "en" },
    ],
  },
  {
    id: "behaviour",
    titleKey: "configure.advanced.groups.behaviour",
    fields: [
      { id: "swarm_languages", kind: "string", placeholder: "python,typescript" },
      { id: "swarm_pipeline_hooks_module", kind: "string" },
      { id: "swarm_mcp_auto", kind: "boolean" },
      { id: "swarm_skip_mcp_tools", kind: "boolean" },
      { id: "swarm_disable_tree_sitter", kind: "boolean" },
      { id: "swarm_force_rerun", kind: "boolean" },
    ],
  },
  {
    id: "artifacts",
    titleKey: "configure.advanced.groups.artifacts",
    fields: [
      { id: "swarm_visual_probe_enabled", kind: "boolean" },
      { id: "swarm_visual_base_url", kind: "string" },
      { id: "swarm_visual_start_command", kind: "string" },
      { id: "swarm_visual_start_directory", kind: "string" },
      { id: "swarm_visual_ready_path", kind: "string", placeholder: "/" },
      { id: "swarm_visual_pages", kind: "string", placeholder: "/" },
      { id: "swarm_visual_capture_har", kind: "boolean" },
      { id: "swarm_visual_capture_trace", kind: "boolean" },
      { id: "swarm_visual_multimodal_review", kind: "boolean" },
      { id: "swarm_visual_max_review_images", kind: "number", placeholder: "4" },
    ],
  },
  {
    id: "notifications",
    titleKey: "configure.advanced.groups.notifications",
    fields: [{ id: "human_manual_review", kind: "boolean" }],
  },
];

const query = ref("");

const form = computed(() => settings.form as Record<string, unknown>);

const visibleGroups = computed(() => {
  const term = query.value.trim().toLowerCase();
  if (!term) return GROUPS;
  return GROUPS.map((group) => ({
    ...group,
    fields: group.fields.filter((field) =>
      String(field.id).toLowerCase().includes(term),
    ),
  })).filter((group) => group.fields.length > 0);
});

const hasMatches = computed(() =>
  visibleGroups.value.some((group) => group.fields.length > 0),
);

function onChange(): void {
  settings.saveSettingsSoon();
}
</script>

<style scoped>
.advanced-pane {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.advanced-pane__search {
  appearance: none;
  width: 280px;
  padding: 7px 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-size: 12px;
}

.advanced-pane__search:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.advanced-pane__banner {
  margin: 0;
  padding: 10px 14px;
  background: var(--accent-soft);
  color: var(--accent-2);
  border-radius: var(--r-md);
  font-size: 12px;
}

.advanced-pane__empty {
  padding: 24px;
  text-align: center;
  color: var(--ink-4);
  font-size: 13px;
}

.advanced-pane__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.advanced-pane__group-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
  margin: 0 0 4px;
}

.advanced-pane__rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.advanced-pane__row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(220px, 2fr);
  align-items: center;
  gap: 16px;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
}

.advanced-pane__field-label {
  cursor: pointer;
  min-width: 0;
}

.advanced-pane__field-id {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-2);
  word-break: break-all;
}

.advanced-pane__input {
  appearance: none;
  width: 100%;
  padding: 7px 10px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: var(--bg-2);
  color: var(--ink);
  font-size: 12px;
  font-family: var(--font-mono);
}

.advanced-pane__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.advanced-pane__checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}
</style>
