<template>
  <section class="run-live-steps">
    <h3 class="run-live-steps__title">{{ heading }}</h3>
    <ol class="run-live-steps__list">
      <li
        v-for="(step, index) in steps"
        :key="`${step.id}-${index}`"
        class="run-live-steps__row"
        :class="`run-live-steps__row--${step.state}`"
      >
        <span class="run-live-steps__index">{{ index + 1 }}</span>
        <span class="run-live-steps__id">{{ step.id }}</span>
        <div class="run-live-steps__trailing">
          <span class="run-live-steps__state">
            {{ labelFor(step.state) }}
          </span>
          <StepForkButton
            v-if="taskId && (step.state === 'completed' || step.state === 'active')"
            :busy="forkingStepId === step.id"
            @fork="openComposer(step.id)"
          />
        </div>
        <div v-if="composingStepId === step.id" class="run-live-steps__fork-form">
          <input
            v-model="instruction"
            type="text"
            class="run-live-steps__fork-input"
            :placeholder="t('stepFork.instructionPlaceholder')"
            :aria-label="t('stepFork.instructionPlaceholder')"
            @keydown.enter="onFork(step.id)"
            @keydown.esc="closeComposer"
          />
          <button
            type="button"
            class="run-live-steps__fork-confirm"
            @click="onFork(step.id)"
          >
            {{ t("stepFork.confirm") }}
          </button>
          <button type="button" class="run-live-steps__fork-cancel" @click="closeComposer">
            {{ t("stepFork.cancel") }}
          </button>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import type { StepRow, StepState } from "./useRunLiveSteps";
import StepForkButton from "@/features/step-fork/StepForkButton.vue";
import { useInjectedSwarmRunController } from "@/features/swarm-run";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  heading: string;
  steps: StepRow[];
  labelFor: (state: StepState) => string;
  taskId?: string | null;
}>();

const router = useRouter();
const controller = useInjectedSwarmRunController();
const { t } = useI18n();
const forkingStepId = ref<string | null>(null);
const composingStepId = ref<string | null>(null);
const instruction = ref("");

function openComposer(stepId: string): void {
  composingStepId.value = stepId;
  instruction.value = "";
}

function closeComposer(): void {
  composingStepId.value = null;
  instruction.value = "";
}

// The fork re-run streams inside the POST response, so navigate from the
// branch-created callback — awaiting the call would leave the operator staring
// at the parent run until the fork finishes.
function onFork(stepId: string): void {
  const parentTaskId = props.taskId;
  if (!parentTaskId || forkingStepId.value) return;
  forkingStepId.value = stepId;
  const change = instruction.value;
  closeComposer();
  void controller
    .onForkStep(parentTaskId, stepId, change, (forkedTaskId) => {
      forkingStepId.value = null;
      void router.push(`/run/active?task_id=${encodeURIComponent(forkedTaskId)}`);
    })
    .finally(() => {
      forkingStepId.value = null;
    });
}
</script>

<style scoped>
.run-live-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.run-live-steps__title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
  margin: 0;
}

.run-live-steps__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.run-live-steps__row {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
}

.run-live-steps__row--active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.run-live-steps__row--completed {
  border-color: color-mix(in srgb, var(--ok) 40%, transparent);
}

.run-live-steps__row--failed {
  border-color: color-mix(in srgb, var(--error) 40%, transparent);
}

.run-live-steps__index {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-4);
  text-align: center;
}

.run-live-steps__id {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.run-live-steps__state {
  font-size: 10px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.run-live-steps__fork-form {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

.run-live-steps__fork-input {
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--ink);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
}

.run-live-steps__fork-confirm,
.run-live-steps__fork-cancel {
  padding: 4px 8px;
  font-size: 11px;
  color: var(--ink);
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  cursor: pointer;
}

.run-live-steps__trailing {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
