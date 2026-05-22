<template>
  <div class="run-done">
    <AppHeaderContainer />
    <main class="run-done__body">
      <header class="run-done__hero">
        <span
          class="run-done__check"
          :class="`run-done__check--${family}`"
          aria-hidden="true"
        >
          {{ checkSymbol }}
        </span>
        <h1 class="run-done__title">{{ t("runDone.title") }}</h1>
        <p class="run-done__subtitle">
          {{ t("runDone.subtitle", { taskId: runId }) }}
        </p>
      </header>

      <div class="run-done__summary">
        <div class="run-done__summary-cell">
          <span class="run-done__summary-label">{{ t("runDone.status") }}</span>
          <span class="run-done__pill" :class="`run-done__pill--${family}`">
            {{ statusLabel }}
          </span>
        </div>
        <div class="run-done__summary-cell">
          <span class="run-done__summary-label">{{ t("runDone.duration") }}</span>
          <span class="run-done__summary-value">{{ duration }}</span>
        </div>
        <div class="run-done__summary-cell">
          <span class="run-done__summary-label">{{ t("runDone.steps") }}</span>
          <span class="run-done__summary-value">{{ stepCount }}</span>
        </div>
      </div>

      <section class="run-done__artifacts">
        <h3 class="run-done__section-title">{{ t("runDone.artifacts") }}</h3>
        <p v-if="!artifactPath" class="run-done__artifacts-empty">
          {{ t("runDone.artifactsEmpty") }}
        </p>
        <p v-else class="run-done__artifact-path">{{ artifactPath }}</p>
      </section>

      <div class="run-done__actions">
        <button type="button" class="run-done__btn" @click="onBackToRun">
          {{ t("runDone.backToRun") }}
        </button>
        <button
          v-if="historyId"
          type="button"
          class="run-done__btn run-done__btn--primary"
          @click="onOpenHistory"
        >
          {{ t("runDone.openHistory") }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import AppHeaderContainer from "@/widgets/header/AppHeaderContainer.vue";
import { useUiStore, type HistoryEntry } from "@/shared/store/ui";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  runId: string;
}>();

const router = useRouter();
const ui = useUiStore();
const { t } = useI18n();

const historyEntry = computed<HistoryEntry | null>(() => {
  return ui.historyList.find((entry) => entry.taskId === props.runId) ?? null;
});

const historyId = computed(() => historyEntry.value?.id ?? null);

const statusLabel = computed<string>(() => {
  if (historyEntry.value?.status) return historyEntry.value.status;
  if (ui.taskId === props.runId && ui.taskStatus) return ui.taskStatus;
  return "—";
});

const family = computed<"ok" | "fail" | "warn" | "run" | "pending">(() => {
  const status = historyEntry.value?.status ?? ui.taskStatus;
  if (status === "completed" || status === "completed_no_writes") return "ok";
  if (status === "completed_with_failures") return "warn";
  if (status === "failed" || status === "cancelled") return "fail";
  if (status === "running" || status === "in_progress") return "run";
  return "pending";
});

const checkSymbol = computed(() => {
  if (family.value === "ok") return "✓";
  if (family.value === "fail") return "✕";
  if (family.value === "warn") return "!";
  return "•";
});

const duration = computed(() => {
  const ms = historyEntry.value?.durationMs ?? null;
  if (!ms || ms <= 0) return "—";
  const seconds = Math.round(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${rem.toString().padStart(2, "0")}s`;
});

const stepCount = computed(() => historyEntry.value?.pipeline_steps?.length ?? 0);

const artifactPath = computed<string | null>(() => {
  const root = historyEntry.value?.workspace_root?.trim();
  if (!root) return null;
  return root;
});

function onBackToRun(): void {
  void router.push("/run");
}

function onOpenHistory(): void {
  if (historyId.value) {
    void router.push(`/history/${historyId.value}`);
  }
}
</script>

<style scoped>
.run-done {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  padding-top: var(--hdr-h);
  background: var(--bg);
}

.run-done__body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 40px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 760px;
  margin: 0 auto;
  width: 100%;
}

.run-done__hero {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.run-done__check {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 600;
  color: #fff;
  background: var(--ink-3);
}

.run-done__check--ok {
  background: var(--ok);
}

.run-done__check--fail {
  background: var(--error);
}

.run-done__check--warn {
  background: var(--warn);
}

.run-done__check--run {
  background: var(--accent);
}

.run-done__title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 500;
  color: var(--ink);
  margin: 0;
}

.run-done__subtitle {
  font-size: 12px;
  color: var(--ink-3);
  font-family: var(--font-mono);
  margin: 0;
}

.run-done__summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.run-done__summary-cell {
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.run-done__summary-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
}

.run-done__summary-value {
  font-size: 15px;
  font-family: var(--font-mono);
  color: var(--ink);
}

.run-done__pill {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  width: fit-content;
}

.run-done__pill--ok {
  background: var(--ok-soft);
  color: var(--ok);
}

.run-done__pill--fail {
  background: color-mix(in srgb, var(--error) 16%, transparent);
  color: var(--error);
}

.run-done__pill--warn {
  background: rgba(201, 138, 26, 0.16);
  color: var(--warn);
}

.run-done__pill--run {
  background: var(--accent-soft);
  color: var(--accent-2);
}

.run-done__pill--pending {
  background: var(--card-soft);
  color: var(--ink-3);
}

.run-done__section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
  margin: 0 0 8px;
}

.run-done__artifacts {
  display: flex;
  flex-direction: column;
}

.run-done__artifacts-empty {
  margin: 0;
  padding: 14px 16px;
  border: 1px dashed var(--line);
  border-radius: var(--r-md);
  color: var(--ink-4);
  font-size: 13px;
}

.run-done__artifact-path {
  margin: 0;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 13px;
  word-break: break-all;
}

.run-done__actions {
  display: flex;
  gap: 8px;
}

.run-done__btn {
  appearance: none;
  padding: 8px 18px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.run-done__btn:hover {
  border-color: var(--line-strong);
}

.run-done__btn--primary {
  background: var(--accent);
  color: #fff;
  border-color: transparent;
}

.run-done__btn--primary:hover {
  filter: brightness(1.05);
}
</style>
