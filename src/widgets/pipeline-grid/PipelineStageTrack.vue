<template>
  <div v-if="stages.length > 0" class="pipeline-run-card__track">
    <div
      v-for="(stage, idx) in stages"
      :key="stage.key"
      class="pipeline-run-card__stage"
      :class="{
        'pipeline-run-card__stage--completed': stage.state === 'done',
        'pipeline-run-card__stage--active': stage.state === 'active',
        'pipeline-run-card__stage--waiting': stage.state === 'waiting',
      }"
      :title="`${stage.label}: ${t(`pipelineStage.state.${stage.state}`)}`"
    >
      <span class="pipeline-run-card__stage-pip">{{ idx + 1 }}</span>
      <span class="pipeline-run-card__stage-label">{{ stage.label }}</span>
      <div v-if="idx < stages.length - 1" class="pipeline-run-card__stage-connector" />
    </div>
  </div>
  <p v-else class="pipeline-run-card__track-empty">
    {{ t("pipelineStage.unknownPlan") }}
  </p>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";

type StageState = "pending" | "active" | "waiting" | "done";

interface StageInfo {
  key: string;
  label: string;
  state: StageState;
}

const props = withDefaults(
  defineProps<{
    /** The run's real pipeline step ids, in execution order. */
    steps?: string[];
    status?: string | null;
    activeStep?: string | null;
    completedSteps?: string[];
    isAttentionRequired?: boolean;
  }>(),
  {
    steps: () => [],
    status: "running",
    activeStep: null,
    completedSteps: () => [],
    isAttentionRequired: false,
  },
);

const { t } = useI18n();

const stages = computed<StageInfo[]>(() => {
  const normalizedStatus = (props.status ?? "").toLowerCase();
  const isDone =
    normalizedStatus === "completed" ||
    normalizedStatus === "done" ||
    normalizedStatus === "completed_no_writes" ||
    normalizedStatus === "completed_with_failures" ||
    normalizedStatus === "success";

  const completed = new Set(props.completedSteps);
  // Only the run's own step list may drive the track. A background run whose
  // active step is unknown shows its real plan with nothing lit rather than a
  // guessed stage.
  const activeIndex = props.activeStep ? props.steps.indexOf(props.activeStep) : -1;

  return props.steps.map((stepId, index) => {
    let state: StageState = "pending";
    if (isDone || completed.has(stepId) || (activeIndex >= 0 && index < activeIndex)) {
      state = "done";
    } else if (index === activeIndex) {
      state = props.isAttentionRequired ? "waiting" : "active";
    }
    return { key: `${stepId}-${index}`, label: stepId, state };
  });
});
</script>

<style scoped>
.pipeline-run-card__track {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0;
  position: relative;
}

.pipeline-run-card__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  position: relative;
  flex: 1;
}

.pipeline-run-card__stage-pip {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-2);
  color: var(--ink-3);
  z-index: 1;
}

.pipeline-run-card__stage--completed .pipeline-run-card__stage-pip {
  background: var(--ok);
  color: #fff;
}

.pipeline-run-card__stage--active .pipeline-run-card__stage-pip {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 0 6px var(--accent);
}

.pipeline-run-card__stage--waiting .pipeline-run-card__stage-pip {
  background: var(--error);
  color: #fff;
  box-shadow: 0 0 6px var(--error);
}

.pipeline-run-card__stage-label {
  font-size: 9px;
  text-transform: uppercase;
  color: var(--ink-4);
}

.pipeline-run-card__stage--active .pipeline-run-card__stage-label,
.pipeline-run-card__stage--completed .pipeline-run-card__stage-label {
  color: var(--ink-2);
  font-weight: 600;
}

.pipeline-run-card__stage-connector {
  position: absolute;
  top: 9px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: var(--line);
  z-index: 0;
}

.pipeline-run-card__stage--completed .pipeline-run-card__stage-connector {
  background: var(--ok);
}
</style>
