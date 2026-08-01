<template>
  <section
    v-if="isVisible"
    class="run-diagnostics"
    :aria-label="t('runDiagnostics.cardAria')"
  >
    <header class="run-diagnostics__header">
      <h3 class="run-diagnostics__title">{{ t("runDiagnostics.headline") }}</h3>
      <select
        v-if="selectableTasks.length > 1"
        v-model="selectedTaskId"
        class="run-diagnostics__select"
        :aria-label="t('runDiagnostics.selectAria')"
      >
        <option
          v-for="entry in selectableTasks"
          :key="entry.taskId"
          :value="entry.taskId"
        >
          {{ entry.label }}
        </option>
      </select>
      <button
        type="button"
        class="run-diagnostics__btn"
        :disabled="store.loading.value || !canFetch"
        @click="onRefresh"
      >
        {{
          store.loading.value
            ? t("runDiagnostics.refreshing")
            : t("runDiagnostics.refresh")
        }}
      </button>
    </header>

    <p v-if="store.lastError.value" class="run-diagnostics__error">
      {{ store.lastError.value }}
    </p>

    <RunDiagnosticsBody
      v-if="diagnostics"
      :diagnostics="diagnostics"
      :missing-sections="missingSections"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import { useRunDiagnostics } from "@/features/run-diagnostics/useRunDiagnostics";
import { useI18n } from "@/shared/lib/i18n";
import { useUiStore } from "@/shared/store/ui";
import RunDiagnosticsBody from "./RunDiagnosticsBody.vue";

const props = defineProps<{
  taskId: string | null;
  workspaceRoot: string | null;
}>();
const emit = defineEmits<{ visibility: [visible: boolean] }>();

const { t } = useI18n();
const store = useRunDiagnostics();
const ui = useUiStore();
const diagnostics = computed(() => store.diagnostics.value);
const selectedTaskId = ref<string>(props.taskId ?? "");

const selectableTasks = computed(() => {
  const entries: { taskId: string; label: string }[] = [];
  for (const entry of ui.historyList) {
    if (!entry.taskId) continue;
    const titleSource = entry.prompt || entry.taskId;
    const trimmed = titleSource.split("\n")[0]?.slice(0, 60) ?? entry.taskId;
    entries.push({ taskId: entry.taskId, label: trimmed });
  }
  return entries;
});

const effectiveTaskId = computed(() => {
  if (selectedTaskId.value) return selectedTaskId.value;
  return props.taskId ?? "";
});

// Diagnostics live under the run's own workspace. Picking another run from the
// selector must follow it there — reusing the current run's root queried the
// wrong directory and reported the other run as having no diagnostics.
const effectiveWorkspaceRoot = computed(() => {
  const taskId = effectiveTaskId.value;
  if (taskId && taskId !== props.taskId) {
    const entry = ui.historyList.find((item) => item.taskId === taskId);
    const root = (entry?.workspace_root ?? "").trim();
    if (root) return root;
  }
  return props.workspaceRoot ?? "";
});

const SECTION_KEYS = [
  "phase_loop",
  "wiki_context_tier",
  "entailment_verdict",
  "citation_enforcement",
  "ragas_metrics",
  "skill_dispatch",
  "workspace_isolation",
  "dev_shell_sandbox",
  "memory",
] as const;

const missingSections = computed(() => {
  const current = diagnostics.value;
  if (!current) return [];
  const populated = new Set<string>();
  if (current.phaseLoop) populated.add("phase_loop");
  if (current.wikiContextTier) populated.add("wiki_context_tier");
  if (current.entailmentVerdict) populated.add("entailment_verdict");
  if (current.citation) populated.add("citation_enforcement");
  if (current.ragasMetrics) populated.add("ragas_metrics");
  if (current.skillDispatch) populated.add("skill_dispatch");
  if (current.workspaceIsolation) populated.add("workspace_isolation");
  if (current.devShellSandbox) populated.add("dev_shell_sandbox");
  if (current.memory) populated.add("memory");
  const hints = current.enableHints ?? {};
  const entries: { key: string; hint: string }[] = [];
  for (const key of SECTION_KEYS) {
    if (populated.has(key)) continue;
    const hint = hints[key];
    if (typeof hint === "string" && hint.length > 0) {
      entries.push({ key, hint });
    }
  }
  return entries;
});

const canFetch = computed(
  () => Boolean(effectiveTaskId.value) && Boolean(effectiveWorkspaceRoot.value),
);

// A run that produced no diagnostics has nothing to say: every section is
// behind its own flag, so an always-on card would be a permanent empty box.
const isVisible = computed(() => {
  if (store.lastError.value) return true;
  const current = diagnostics.value;
  if (!current) return false;
  return (
    Boolean(
      current.phaseLoop ||
      current.wikiContextTier ||
      current.entailmentVerdict ||
      current.citation ||
      current.ragasMetrics ||
      current.skillDispatch ||
      current.workspaceIsolation ||
      current.devShellSandbox ||
      current.memory,
    ) || missingSections.value.length > 0
  );
});

watch(isVisible, (visible) => emit("visibility", visible), { immediate: true });

async function onRefresh(): Promise<void> {
  if (!canFetch.value) return;
  await store.refresh({
    taskId: effectiveTaskId.value,
    workspaceRoot: effectiveWorkspaceRoot.value,
  });
}

onMounted(() => {
  if (canFetch.value && !diagnostics.value) void onRefresh();
});

watch(
  () => `${effectiveTaskId.value}|${effectiveWorkspaceRoot.value}`,
  () => {
    if (canFetch.value) void onRefresh();
  },
);

watch(
  () => props.taskId,
  (next) => {
    if (next && !selectedTaskId.value) selectedTaskId.value = next;
  },
);
</script>

<style scoped>
.run-diagnostics {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.run-diagnostics__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.run-diagnostics__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.run-diagnostics__select {
  appearance: none;
  background: var(--bg-elev);
  color: var(--ink-2);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 4px 8px;
  font-size: 12px;
  max-width: 220px;
}

.run-diagnostics__btn {
  appearance: none;
  background: transparent;
  color: var(--ink-2);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.run-diagnostics__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.run-diagnostics__error {
  margin: 0;
  font-size: 12px;
  color: var(--error);
}

.run-diagnostics__hint {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}
</style>
