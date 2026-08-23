<template>
  <section class="run-continue" aria-labelledby="run-continue-heading">
    <h3 id="run-continue-heading" class="run-continue__heading">
      {{ t("runDone.continue.heading") }}
    </h3>
    <p class="run-continue__desc">
      {{ t("runDone.continue.description") }}
    </p>

    <div class="run-continue__form">
      <textarea
        v-model="message"
        class="run-continue__input"
        :placeholder="t('runDone.continue.placeholder')"
        rows="3"
        :disabled="loadingProposal || runningContinue"
        @keydown.ctrl.enter="onPropose"
        @keydown.meta.enter="onPropose"
      />

      <div v-if="error" class="run-continue__error" role="alert">
        {{ error }}
      </div>

      <div class="run-continue__actions">
        <button
          type="button"
          class="run-continue__btn"
          :disabled="!message.trim() || loadingProposal || runningContinue"
          @click="onPropose"
        >
          {{
            loadingProposal
              ? t("runDone.continue.inferring")
              : t("runDone.continue.proposeBtn")
          }}
        </button>
      </div>
    </div>

    <div v-if="proposal" class="run-continue__proposal">
      <div v-if="proposal.rationale" class="run-continue__rationale">
        <span class="run-continue__rationale-label"
          >{{ t("runDone.continue.rationale") }}:</span
        >
        {{ proposal.rationale }}
      </div>

      <div class="run-continue__steps-picker">
        <label class="run-continue__steps-label"
          >{{ t("runDone.continue.stepsLabel") }}:</label
        >
        <div class="run-continue__steps-list">
          <label
            v-for="step in proposal.proposed_steps"
            :key="step"
            class="run-continue__step-item"
          >
            <input
              v-model="confirmedSteps"
              type="checkbox"
              :value="step"
              :disabled="runningContinue"
            />
            <span class="run-continue__step-name">{{ step }}</span>
          </label>
        </div>
      </div>

      <button
        type="button"
        class="run-continue__btn run-continue__btn--primary"
        :disabled="!confirmedSteps.length || runningContinue"
        @click="onRunContinue"
      >
        {{
          runningContinue ? t("runDone.continue.running") : t("runDone.continue.runBtn")
        }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "@/shared/lib/i18n";
import {
  postContinuePropose,
  postContinueStream,
  type ContinueProposal,
} from "@/shared/api/endpoints/task-gates";
import { drainStream } from "@/shared/lib/task-gate-actions";

const props = defineProps<{
  runId: string;
}>();

const router = useRouter();
const { t } = useI18n();

const message = ref("");
const loadingProposal = ref(false);
const runningContinue = ref(false);
const proposal = ref<ContinueProposal | null>(null);
const confirmedSteps = ref<string[]>([]);
const error = ref<string | null>(null);

async function onPropose(): Promise<void> {
  const text = message.value.trim();
  if (!text || loadingProposal.value || runningContinue.value) return;

  loadingProposal.value = true;
  error.value = null;
  proposal.value = null;

  try {
    const res = await postContinuePropose(props.runId, text);
    proposal.value = res;
    confirmedSteps.value = [...(res.proposed_steps || [])];
  } catch (exc) {
    error.value = (exc as Error)?.message || "Failed to infer target steps";
  } finally {
    loadingProposal.value = false;
  }
}

async function onRunContinue(): Promise<void> {
  const text = message.value.trim();
  if (!text || !confirmedSteps.value.length || runningContinue.value) return;

  runningContinue.value = true;
  error.value = null;

  try {
    const response = await postContinueStream(props.runId, text, confirmedSteps.value);
    if (!response.ok) {
      error.value = `continue HTTP ${response.status}`;
      runningContinue.value = false;
      return;
    }
    const newTaskId = response.headers.get("X-Task-Id");
    if (!newTaskId) {
      error.value = "continue: backend returned no task id";
      runningContinue.value = false;
      await drainStream(response.body);
      return;
    }
    // Keep reading the SSE body: the pipeline runs inside this response, and
    // an unread body makes the backend see a disconnect and cancel the run.
    const draining = drainStream(response.body);
    void router.push(`/run?task_id=${encodeURIComponent(newTaskId)}`);
    await draining;
  } catch (exc) {
    error.value = (exc as Error)?.message || "Failed to launch continue run";
    runningContinue.value = false;
  }
}
</script>

<style scoped>
.run-continue {
  margin-top: 1.5rem;
  padding: 1.25rem;
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--color-border, #e2e8f0);
  background-color: var(--color-surface, #ffffff);
}

.run-continue__heading {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary, #0f172a);
}

.run-continue__desc {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--color-text-muted, #64748b);
}

.run-continue__form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.run-continue__input {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.875rem;
  border-radius: var(--radius-sm, 6px);
  border: 1px solid var(--color-border, #cbd5e1);
  background-color: var(--color-bg, #f8fafc);
  color: var(--color-text-primary, #0f172a);
  resize: vertical;
  box-sizing: border-box;
}

.run-continue__input:focus {
  outline: none;
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.run-continue__error {
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  border-radius: var(--radius-sm, 6px);
  background-color: var(--color-danger-subtle, #fef2f2);
  color: var(--color-danger, #ef4444);
  border: 1px solid var(--color-danger-border, #fecaca);
}

.run-continue__actions {
  display: flex;
  justify-content: flex-end;
}

.run-continue__btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--radius-sm, 6px);
  border: 1px solid var(--color-border, #cbd5e1);
  background-color: var(--color-surface, #ffffff);
  color: var(--color-text-primary, #0f172a);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.run-continue__btn:hover:not(:disabled) {
  background-color: var(--color-bg-hover, #f1f5f9);
}

.run-continue__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.run-continue__btn--primary {
  background-color: var(--color-primary, #3b82f6);
  color: #ffffff;
  border-color: var(--color-primary, #3b82f6);
}

.run-continue__btn--primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover, #2563eb);
}

.run-continue__proposal {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border, #e2e8f0);
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.run-continue__rationale {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #334155);
  background-color: var(--color-bg, #f8fafc);
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-sm, 6px);
}

.run-continue__rationale-label {
  font-weight: 600;
  margin-right: 0.375rem;
}

.run-continue__steps-picker {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.run-continue__steps-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary, #475569);
}

.run-continue__steps-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.run-continue__step-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm, 4px);
  background-color: var(--color-bg-subtle, #f1f5f9);
  cursor: pointer;
}
</style>
