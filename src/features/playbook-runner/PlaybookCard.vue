<script setup lang="ts">
import { ref, reactive } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type { Playbook, RunPlaybookResponse } from "@/entities/playbook/model/types";
import { runPlaybook } from "@/entities/playbook/api/playbook-api";

const props = defineProps<{
  playbook: Playbook;
}>();

const emit = defineEmits<{
  (event: "started", response: RunPlaybookResponse): void;
}>();

const { t } = useI18n();

const formValues = reactive<Record<string, string>>({});
for (const parameter of props.playbook.parameters) {
  if (parameter.default) {
    formValues[parameter.name] = parameter.default;
  }
}

const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const hasStarted = ref(false);

function firstMissingRequiredParameter(): string | null {
  for (const parameter of props.playbook.parameters) {
    if (parameter.required && !formValues[parameter.name]?.trim()) {
      return parameter.name;
    }
  }
  return null;
}

async function handleRun(): Promise<void> {
  const missing = firstMissingRequiredParameter();
  if (missing) {
    errorMessage.value = t("playbooks.missingParameter", { name: missing });
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;
  hasStarted.value = false;

  try {
    const response = await runPlaybook(props.playbook.id, {
      parameters: { ...formValues },
    });
    hasStarted.value = true;
    emit("started", response);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="playbook-card">
    <div class="playbook-card__header">
      <div>
        <div class="playbook-card__eyebrow">
          {{ t("playbooks.title") }}
        </div>
        <div class="playbook-card__heading">
          <h3 class="playbook-card__name">
            {{ playbook.name }}
          </h3>
          <span class="chip playbook-card__category">
            {{ playbook.category }}
          </span>
        </div>
        <p class="playbook-card__description">
          {{ playbook.description }}
        </p>
      </div>
    </div>

    <div class="playbook-card__section">
      <h4 class="playbook-card__section-title">
        {{ t("playbooks.steps") }}
      </h4>
      <ol class="playbook-card__steps">
        <li
          v-for="(step, index) in playbook.steps"
          :key="step.id"
          class="playbook-card__step"
        >
          <span class="chip playbook-card__step-index">
            {{ index + 1 }}
          </span>
          <span class="playbook-card__step-role">[{{ step.role }}]</span>
          <span class="playbook-card__step-name">{{ step.name }}</span>
          <span v-if="step.expected_artifact" class="playbook-card__step-artifact">
            &rarr; {{ step.expected_artifact }}
          </span>
        </li>
      </ol>
    </div>

    <div v-if="playbook.parameters.length > 0" class="playbook-card__section">
      <h4 class="playbook-card__section-title">
        {{ t("playbooks.parameters") }}
      </h4>
      <div class="playbook-card__params">
        <div
          v-for="parameter in playbook.parameters"
          :key="parameter.name"
          class="playbook-card__param"
        >
          <label :for="'param-' + parameter.name" class="field-label">
            {{ parameter.name }}
            <span v-if="parameter.required" class="playbook-card__required">*</span>
          </label>
          <input
            :id="'param-' + parameter.name"
            v-model="formValues[parameter.name]"
            type="text"
            :placeholder="parameter.description || parameter.name"
          />
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="playbook-card__error">
      {{ t("playbooks.error", { error: errorMessage }) }}
    </div>

    <div v-if="hasStarted" class="playbook-card__success">
      {{ t("playbooks.started") }}
    </div>

    <div class="playbook-card__actions">
      <button
        type="button"
        :disabled="isLoading"
        class="btn-primary"
        @click="handleRun"
      >
        <span>{{ isLoading ? t("playbooks.running") : t("playbooks.run") }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.playbook-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-md);
  padding: 16px 18px;
}

.playbook-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.playbook-card__eyebrow {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-4);
  margin-bottom: 4px;
}

.playbook-card__heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.playbook-card__name {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.playbook-card__category {
  border-color: var(--line-strong);
  color: var(--accent);
}

.playbook-card__description {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ink-3);
}

.playbook-card__section {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.playbook-card__section-title {
  margin: 0;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
}

.playbook-card__steps {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--ink-2);
}

.playbook-card__step {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
}

.playbook-card__step-index {
  font-size: 10px;
  padding: 1px 8px;
}

.playbook-card__step-role {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink);
}

.playbook-card__step-name {
  color: var(--ink-2);
}

.playbook-card__step-artifact {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-4);
}

.playbook-card__params {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.playbook-card__required {
  color: var(--error);
}

.playbook-card__error {
  margin-top: 12px;
  font-size: 12px;
  color: var(--error);
}

.playbook-card__success {
  margin-top: 12px;
  font-size: 12px;
  color: var(--ok);
}

.playbook-card__actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

.playbook-card__actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
