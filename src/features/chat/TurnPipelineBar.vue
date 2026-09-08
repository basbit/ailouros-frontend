<template>
  <button
    type="button"
    class="turn-pipeline-bar"
    :class="{ 'turn-pipeline-bar--clickable': hasDetailRoute }"
    :title="hasDetailRoute ? t('chat.pipelineBar.openDetail') : undefined"
    @click="onOpenDetail"
  >
    <span class="turn-pipeline-bar__icon" aria-hidden="true">
      <svg
        v-if="summary.isRunning.value"
        class="turn-pipeline-bar__spinner"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="9" />
      </svg>
      <span
        v-else-if="hasFailure"
        class="turn-pipeline-bar__mark turn-pipeline-bar__mark--fail"
      >✕</span>
      <span v-else class="turn-pipeline-bar__mark turn-pipeline-bar__mark--ok">✓</span>
    </span>

    <span class="turn-pipeline-bar__main">
      <span class="turn-pipeline-bar__row">
        <span class="turn-pipeline-bar__label">{{ headline }}</span>
        <span
          v-if="summary.totalSteps.value"
          class="turn-pipeline-bar__counter"
        >
          {{ stepCounter }}
        </span>
        <span
          class="turn-pipeline-bar__status"
          :class="`turn-pipeline-bar__status--${statusKind}`"
        >{{ statusText }}</span>
      </span>

      <span class="turn-pipeline-bar__track" aria-hidden="true">
        <span
          class="turn-pipeline-bar__fill"
          :class="{ 'turn-pipeline-bar__fill--failed': hasFailure }"
          :style="{ width: `${progressWidth}%` }"
        />
      </span>

      <span
        v-if="summary.latestLog.value"
        class="turn-pipeline-bar__log"
      >{{ summary.latestLog.value }}</span>
    </span>

    <span
      v-if="hasDetailRoute"
      class="turn-pipeline-bar__chevron"
      aria-hidden="true"
    >›</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "@/shared/lib/i18n";
import type { TurnPipelineSummary } from "@/entities/pipeline-progress";

const props = defineProps<{
  summary: TurnPipelineSummary;
  taskId: string | null;
}>();

const router = useRouter();
const { t } = useI18n();

const TERMINAL_STATUSES = new Set([
  "completed",
  "completed_no_writes",
  "completed_with_failures",
  "failed",
  "cancelled",
  "blocked",
]);

const hasFailure = computed(
  () =>
    props.summary.failedCount.value > 0 ||
    props.summary.status.value === "failed" ||
    props.summary.status.value === "cancelled",
);

const statusKind = computed(() => {
  if (props.summary.isRunning.value) return "running";
  const status = props.summary.status.value;
  if (status === "failed" || status === "cancelled" || hasFailure.value) {
    return "failed";
  }
  if (status === "awaiting_human") return "gate";
  if (TERMINAL_STATUSES.has(status)) return "completed";
  return "idle";
});

const statusText = computed(() => t(`chat.pipelineBar.status.${statusKind.value}`));

const stepCounter = computed(() =>
  t("chat.pipelineBar.stepCounter", {
    done: props.summary.completedCount.value,
    total: props.summary.totalSteps.value,
  }),
);

const headline = computed(() => {
  if (statusKind.value === "gate") {
    return t("chat.pipelineBar.gateTitle", {
      step: props.summary.activeStep.value ?? "",
    });
  }
  if (props.summary.isRunning.value) return t("chat.pipelineBar.runningTitle");
  if (hasFailure.value) return t("chat.pipelineBar.failedTitle");
  return t("chat.pipelineBar.doneTitle");
});

const progressWidth = computed(() => {
  if (hasFailure.value) return 100;
  if (statusKind.value === "completed") return 100;
  const pct = props.summary.progressPct.value;
  // A running pipeline with no completed step yet still shows motion.
  if (!pct && props.summary.isRunning.value) return 8;
  return pct;
});

const hasDetailRoute = computed(() => !!props.taskId);

function onOpenDetail(): void {
  if (!props.taskId) return;
  // The bar is always a link into the pipeline history; the history detail
  // page renders both live and finished runs from the task snapshot.
  void router.push(`/history/${encodeURIComponent(props.taskId)}`);
}
</script>

<style scoped>
.turn-pipeline-bar {
  appearance: none;
  text-align: left;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  cursor: default;
  color: var(--ink);
  font: inherit;
}

.turn-pipeline-bar--clickable {
  cursor: pointer;
}

.turn-pipeline-bar--clickable:hover {
  border-color: var(--line-strong, var(--line));
  background: var(--bg-2);
}

.turn-pipeline-bar__icon {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
}

.turn-pipeline-bar__mark {
  font-size: 12px;
  font-weight: 700;
}

.turn-pipeline-bar__mark--ok {
  color: var(--success);
}

.turn-pipeline-bar__mark--fail {
  color: var(--error);
}

.turn-pipeline-bar__spinner {
  width: 14px;
  height: 14px;
  animation: turn-pipeline-spin 0.9s linear infinite;
}

.turn-pipeline-bar__spinner circle {
  fill: none;
  stroke: var(--accent);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 42 18;
}

@keyframes turn-pipeline-spin {
  to {
    transform: rotate(360deg);
  }
}

.turn-pipeline-bar__main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.turn-pipeline-bar__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.turn-pipeline-bar__label {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.turn-pipeline-bar__counter {
  font-size: 11px;
  color: var(--ink-3);
  font-family: var(--font-mono);
  white-space: nowrap;
}

.turn-pipeline-bar__status {
  margin-left: auto;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 10px;
  text-transform: uppercase;
  font-family: var(--font-mono);
  white-space: nowrap;
}

.turn-pipeline-bar__status--running {
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
}

.turn-pipeline-bar__status--completed {
  background: color-mix(in srgb, var(--success) 15%, transparent);
  color: var(--success);
}

.turn-pipeline-bar__status--failed {
  background: color-mix(in srgb, var(--error) 15%, transparent);
  color: var(--error);
}

.turn-pipeline-bar__status--gate {
  background: color-mix(in srgb, var(--warn, #c98a1a) 15%, transparent);
  color: var(--warn, #c98a1a);
}

.turn-pipeline-bar__status--idle {
  background: var(--bg-2);
  color: var(--ink-3);
}

.turn-pipeline-bar__track {
  position: relative;
  height: 4px;
  border-radius: 999px;
  background: var(--bg-2);
  overflow: hidden;
}

.turn-pipeline-bar__fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent), var(--accent-2, var(--accent)));
  transition: width 0.4s ease;
}

.turn-pipeline-bar__fill--failed {
  background: var(--error);
}

.turn-pipeline-bar__log {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.turn-pipeline-bar__chevron {
  flex: 0 0 auto;
  color: var(--ink-4);
  font-size: 18px;
  line-height: 1;
}
</style>