<template>
  <div class="pipeline-run-card__track">
    <div
      v-for="(stage, idx) in stages"
      :key="stage.key"
      class="pipeline-run-card__stage"
      :class="{
        'pipeline-run-card__stage--completed': stage.state === 'done',
        'pipeline-run-card__stage--active': stage.state === 'active',
        'pipeline-run-card__stage--waiting': stage.state === 'waiting',
      }"
      :title="`${stage.label}: ${stage.state}`"
    >
      <span class="pipeline-run-card__stage-pip">{{ idx + 1 }}</span>
      <span class="pipeline-run-card__stage-label">{{ stage.label }}</span>
      <div v-if="idx < stages.length - 1" class="pipeline-run-card__stage-connector" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

export interface StageInfo {
  key: string;
  label: string;
  state: "pending" | "active" | "waiting" | "done";
}

const props = withDefaults(
  defineProps<{
    status?: string | null;
    activeStep?: string | null;
    isAttentionRequired?: boolean;
  }>(),
  {
    status: "running",
    activeStep: null,
    isAttentionRequired: false,
  },
);

const stages = computed<StageInfo[]>(() => {
  const normalizedStatus = (props.status ?? "").toLowerCase();
  const step = (props.activeStep ?? "").toLowerCase();

  const isDone = normalizedStatus === "completed" || normalizedStatus === "done";
  const isFailed = normalizedStatus === "failed" || normalizedStatus === "error";

  let activeIndex = 0;
  if (step.includes("architect") || step.includes("plan")) activeIndex = 1;
  else if (step.includes("implement") || step.includes("code") || step.includes("dev"))
    activeIndex = 2;
  else if (
    step.includes("test") ||
    step.includes("qa") ||
    step.includes("review") ||
    step.includes("probe")
  )
    activeIndex = 3;
  else if (step.includes("deploy") || step.includes("ci") || step.includes("finish"))
    activeIndex = 4;
  else if (isDone) activeIndex = 5;

  const stageDefinitions = [
    { key: "pm", label: "Spec" },
    { key: "arch", label: "Arch" },
    { key: "dev", label: "Dev" },
    { key: "qa", label: "QA" },
    { key: "deploy", label: "Ship" },
  ];

  return stageDefinitions.map((stageDefinition, idx) => {
    let state: "pending" | "active" | "waiting" | "done" = "pending";
    if (isDone || idx < activeIndex) {
      state = "done";
    } else if (idx === activeIndex) {
      state = props.isAttentionRequired ? "waiting" : isFailed ? "pending" : "active";
    }
    return { ...stageDefinition, state };
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
  background: var(--bg-2, #333);
  color: var(--ink-3, #777);
  z-index: 1;
}

.pipeline-run-card__stage--completed .pipeline-run-card__stage-pip {
  background: var(--ok, #10b981);
  color: #fff;
}

.pipeline-run-card__stage--active .pipeline-run-card__stage-pip {
  background: var(--accent, #6366f1);
  color: #fff;
  box-shadow: 0 0 6px var(--accent, #6366f1);
}

.pipeline-run-card__stage--waiting .pipeline-run-card__stage-pip {
  background: var(--vermillion-alert, #ff4500);
  color: #fff;
  box-shadow: 0 0 6px var(--vermillion-alert, #ff4500);
}

.pipeline-run-card__stage-label {
  font-size: 9px;
  text-transform: uppercase;
  color: var(--ink-4, #666);
}

.pipeline-run-card__stage--active .pipeline-run-card__stage-label,
.pipeline-run-card__stage--completed .pipeline-run-card__stage-label {
  color: var(--ink-2, #bbb);
  font-weight: 600;
}

.pipeline-run-card__stage-connector {
  position: absolute;
  top: 9px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: var(--line, #333);
  z-index: 0;
}

.pipeline-run-card__stage--completed .pipeline-run-card__stage-connector {
  background: var(--ok, #10b981);
}
</style>
