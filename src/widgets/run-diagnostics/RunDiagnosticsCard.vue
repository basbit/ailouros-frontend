<template>
  <section class="run-diagnostics" :aria-label="t('runDiagnostics.cardAria')">
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

    <p v-if="!canFetch" class="run-diagnostics__hint">
      {{ t("runDiagnostics.needsRun") }}
    </p>

    <p v-else-if="!diagnostics && !store.loading.value" class="run-diagnostics__hint">
      {{ t("runDiagnostics.empty") }}
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

const SECTION_KEYS = [
  "phase_loop",
  "wiki_context_tier",
  "entailment_verdict",
  "citation_enforcement",
  "post_pipeline_gates",
  "flare_signal",
] as const;

const missingSections = computed(() => {
  const current = diagnostics.value;
  if (!current) return [];
  const populated = new Set<string>();
  if (current.phaseLoop) populated.add("phase_loop");
  if (current.wikiContextTier) populated.add("wiki_context_tier");
  if (current.entailmentVerdict) populated.add("entailment_verdict");
  if (current.citation) populated.add("citation_enforcement");
  if (current.postPipelineGates) populated.add("post_pipeline_gates");
  if (current.flareSignal) populated.add("flare_signal");
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
  () => Boolean(effectiveTaskId.value) && Boolean(props.workspaceRoot),
);

async function onRefresh(): Promise<void> {
  if (!canFetch.value) return;
  await store.refresh({
    taskId: effectiveTaskId.value,
    workspaceRoot: props.workspaceRoot ?? "",
  });
}

onMounted(() => {
  if (canFetch.value && !diagnostics.value) void onRefresh();
});

watch(
  () => `${effectiveTaskId.value}|${props.workspaceRoot}`,
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
