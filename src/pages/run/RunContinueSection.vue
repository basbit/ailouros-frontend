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
import { ApiError } from "@/shared/api/http";
import { useProjectsStore } from "@/shared/store/projects";
import { useTaskStore } from "@/shared/store/task";
import { useUiStore } from "@/shared/store/ui";
import {
  postContinuePropose,
  postContinueStream,
  type ContinueProposal,
} from "@/shared/api/endpoints/task-gates";
import { drainStream } from "@/shared/lib/task-gate-actions";
import { buildAgentConfig } from "@/shared/lib/agent-config";
import { useInjectedAppSettings } from "@/entities/app-settings/contract";

const props = defineProps<{
  runId: string;
}>();

const router = useRouter();
const { t } = useI18n();
const settings = useInjectedAppSettings();
const ui = useUiStore();
const taskStore = useTaskStore();
const projectsStore = useProjectsStore();

const message = ref("");
const loadingProposal = ref(false);
const runningContinue = ref(false);
const proposal = ref<ContinueProposal | null>(null);
const confirmedSteps = ref<string[]>([]);
const error = ref<string | null>(null);

function describeError(exc: unknown, fallback: string): string {
  if (exc instanceof ApiError && exc.body) {
    try {
      const parsed = JSON.parse(exc.body) as { detail?: unknown };
      if (typeof parsed.detail === "string" && parsed.detail.trim()) {
        return parsed.detail;
      }
    } catch {
      /* fall through to raw body */
    }
    if (exc.body.trim()) return exc.body;
  }
  return (exc as Error)?.message || fallback;
}

async function onPropose(): Promise<void> {
  const text = message.value.trim();
  if (!text || loadingProposal.value || runningContinue.value) return;

  loadingProposal.value = true;
  error.value = null;
  proposal.value = null;

  try {
    const agentConfig = buildAgentConfig(settings);
    const res = await postContinuePropose(props.runId, text, agentConfig);
    proposal.value = res;
    confirmedSteps.value = [...(res.proposed_steps || [])];
  } catch (exc) {
    error.value = describeError(exc, "Failed to infer target steps");
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
    const agentConfig = buildAgentConfig(settings);
    const response = await postContinueStream(
      props.runId,
      text,
      confirmedSteps.value,
      agentConfig,
    );
    if (!response.ok) {
      error.value = `continue HTTP ${response.status}`;
      return;
    }
    const newTaskId = response.headers.get("X-Task-Id");
    if (!newTaskId) {
      error.value = "continue: backend returned no task id";
      await drainStream(response.body);
      return;
    }
    // The live view (`/run/active`) reads ui.taskId from the store, not a
    // route query; the continue run must become the active task or the new
    // run stays invisible. Mirror the launch path in useSwarmRunStart.
    ui.taskId = newTaskId;
    ui.persistActiveTask(newTaskId, projectsStore.currentId);
    ui.trackRun(newTaskId);
    taskStore.setTaskId(newTaskId);
    ui.pushHistory(
      {
        prompt: text,
        agent_config: null,
        pipeline_steps: [],
        taskId: newTaskId,
        workspace_root: settings.form.workspace_root || null,
        project_context_file: settings.form.project_context_file || null,
        workspace_write: settings.form.workspace_write,
        status: "running",
        startedAt: Date.now(),
      },
      projectsStore.currentId,
    );
    // Keep reading the SSE body: the pipeline runs inside this response, and
    // an unread body makes the backend see a disconnect and cancel the run.
    const draining = drainStream(response.body);
    void router.replace(`/run/active?task_id=${encodeURIComponent(newTaskId)}`);
    await draining;
  } catch (exc) {
    error.value = (exc as Error)?.message || "Failed to launch continue run";
  } finally {
    runningContinue.value = false;
  }
}
</script>

<style scoped>
.run-continue {
  margin-top: 1.5rem;
  padding: var(--pad-4);
  border-radius: var(--r-lg);
  border: 1px solid var(--line);
  background-color: var(--card);
}

.run-continue__heading {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ink);
}

.run-continue__desc {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--ink-3);
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
  font-family: var(--font-sans);
  border-radius: var(--r-md);
  border: 1px solid var(--line-strong);
  background-color: var(--bg);
  color: var(--ink);
  resize: vertical;
  box-sizing: border-box;
}

.run-continue__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.run-continue__error {
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  border-radius: var(--r-md);
  background-color: var(--warn);
  color: #fff;
  border: 1px solid var(--warn);
}

.run-continue__actions {
  display: flex;
  justify-content: flex-end;
}

.run-continue__btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: var(--font-sans);
  border-radius: var(--r-md);
  border: 1px solid var(--line-strong);
  background-color: var(--card-soft);
  color: var(--ink);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.run-continue__btn:hover:not(:disabled) {
  background-color: var(--bg-2);
}

.run-continue__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.run-continue__btn--primary {
  background-color: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.run-continue__btn--primary:hover:not(:disabled) {
  background-color: var(--accent-2);
}

.run-continue__proposal {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.run-continue__rationale {
  font-size: 0.875rem;
  color: var(--ink-2);
  background-color: var(--bg);
  padding: 0.625rem 0.75rem;
  border-radius: var(--r-md);
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
  color: var(--ink-2);
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
  border-radius: var(--r-sm);
  background-color: var(--card-soft);
  border: 1px solid var(--line);
  cursor: pointer;
}

.run-continue__step-item:hover {
  border-color: var(--accent);
}

.run-continue__step-item input[type="checkbox"] {
  accent-color: var(--accent);
}
</style>
