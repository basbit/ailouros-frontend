<template>
  <form class="ar-prompt" @submit.prevent="submit">
    <h2 class="ar-prompt__title">{{ t("autoresearch.prompt.title") }}</h2>
    <p class="ar-prompt__intro">{{ t("autoresearch.prompt.intro") }}</p>
    <p class="ar-prompt__note" data-testid="prompt-result-note">
      {{ t("autoresearch.prompt.resultNote") }}
    </p>

    <p v-if="loadError" class="ar-prompt__error" data-testid="prompt-load-error">
      {{ loadError }}
    </p>
    <p
      v-else-if="preset?.problem"
      class="ar-prompt__error"
      data-testid="prompt-preset-problem"
    >
      {{ preset.problem }}
    </p>

    <label class="ar-prompt__field">
      <span>{{ t("autoresearch.prompt.workspace") }}</span>
      <input
        :value="preset?.workspace_root ?? ''"
        name="promptWorkspace"
        type="text"
        readonly
      />
    </label>

    <div class="ar-prompt__row">
      <label class="ar-prompt__field">
        <span>{{ t("autoresearch.prompt.role") }}</span>
        <select v-model="state.role" name="promptRole">
          <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
        </select>
      </label>
      <label class="ar-prompt__field">
        <span>{{ t("autoresearch.prompt.samples") }}</span>
        <input
          v-model.number="state.samples"
          name="promptSamples"
          type="number"
          min="1"
          :max="MAX_PROMPT_EVAL_SAMPLES"
        />
      </label>
      <label class="ar-prompt__field">
        <span>{{ t("autoresearch.form.iterationBudget") }}</span>
        <input
          v-model.number="state.iterationBudget"
          name="promptIterationBudget"
          type="number"
          min="1"
          :max="MAX_ITERATION_BUDGET"
        />
      </label>
    </div>

    <div class="ar-prompt__row">
      <label class="ar-prompt__field">
        <span>{{ t("autoresearch.form.repeats") }}</span>
        <input v-model.number="state.repeats" name="promptRepeats" type="number" min="1" />
      </label>
      <label class="ar-prompt__field">
        <span>{{ t("autoresearch.form.minImprovement") }}</span>
        <input
          v-model.number="state.minImprovementPct"
          name="promptMinImprovementPct"
          type="number"
          min="0"
          step="0.1"
        />
      </label>
    </div>

    <label class="ar-prompt__field">
      <span>{{ t("autoresearch.form.goal") }}</span>
      <textarea v-model="state.goal" name="promptGoal" rows="2" />
    </label>

    <label class="ar-prompt__field">
      <span>{{ t("autoresearch.prompt.judgeModel") }}</span>
      <input v-model="state.judgeModel" name="promptJudgeModel" type="text" />
      <small>{{ t("autoresearch.prompt.judgeModelHint") }}</small>
    </label>

    <p class="ar-prompt__hint">{{ t("autoresearch.prompt.modelNote") }}</p>
    <ul
      v-if="shownProblems.length"
      class="ar-prompt__problems"
      data-testid="prompt-form-problems"
    >
      <li v-for="problem in shownProblems" :key="problem">{{ t(problem) }}</li>
    </ul>
    <p v-if="error" class="ar-prompt__error" data-testid="prompt-form-error">{{ error }}</p>
    <button class="ar-prompt__submit" type="submit" :disabled="busy || !available">
      {{ busy ? t("autoresearch.form.starting") : t("autoresearch.prompt.start") }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type { ImproveRolePromptPreset } from "@/shared/api/endpoints/autoresearch";
import { MAX_ITERATION_BUDGET } from "./model/form";
import {
  MAX_PROMPT_EVAL_SAMPLES,
  defaultPromptPresetForm,
  validatePromptPresetForm,
  type PromptPresetFormState,
} from "./model/promptPreset";

const props = defineProps<{
  preset: ImproveRolePromptPreset | null;
  loadError: string;
  busy: boolean;
  error: string;
}>();
const emit = defineEmits<{ submit: [state: PromptPresetFormState] }>();
const { t } = useI18n();

const roles = computed(() => props.preset?.roles ?? []);
const available = computed(
  () => Boolean(props.preset?.workspace_root) && roles.value.length > 0,
);
const state = reactive<PromptPresetFormState>(
  defaultPromptPresetForm("", t("autoresearch.prompt.defaultGoal")),
);
watch(
  roles,
  (list) => {
    if (!list.includes(state.role)) state.role = list[0] ?? "";
  },
  { immediate: true },
);

const attempted = ref(false);
const problems = computed(() => validatePromptPresetForm(state, roles.value));
const shownProblems = computed(() => (attempted.value ? problems.value : []));

function submit(): void {
  attempted.value = true;
  if (!available.value || problems.value.length) return;
  emit("submit", { ...state });
}
</script>

<style scoped>
.ar-prompt {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ar-prompt__title {
  margin: 0;
  font-size: 15px;
}

.ar-prompt__intro,
.ar-prompt__hint,
.ar-prompt__field small {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
}

.ar-prompt__intro {
  font-size: 12px;
}

.ar-prompt__note {
  margin: 0;
  padding: 8px 10px;
  border: 1px solid var(--c-warning-border);
  border-radius: var(--radius);
  background: var(--c-warning-bg);
  color: var(--c-warning-text);
  font-size: 12px;
}

.ar-prompt__row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ar-prompt__row .ar-prompt__field {
  flex: 1 1 140px;
}

.ar-prompt__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.ar-prompt__field input,
.ar-prompt__field select,
.ar-prompt__field textarea {
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-input);
  color: var(--text);
  font: inherit;
}

.ar-prompt__field input[readonly] {
  color: var(--muted);
}

.ar-prompt__problems,
.ar-prompt__error {
  margin: 0;
  color: var(--danger);
  font-size: 12px;
}

.ar-prompt__submit {
  align-self: flex-start;
  padding: 6px 16px;
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius);
  background: var(--accent-primary);
  color: var(--bg1);
  cursor: pointer;
}

.ar-prompt__submit:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
