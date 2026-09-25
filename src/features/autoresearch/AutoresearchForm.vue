<template>
  <form class="ar-form" @submit.prevent="submit">
    <h2 class="ar-form__title">{{ t("autoresearch.form.title") }}</h2>
    <p class="ar-form__note" data-testid="uncommitted-note">
      {{ t("autoresearch.form.uncommittedNote") }}
    </p>

    <label class="ar-form__field">
      <span>{{ t("autoresearch.form.workspaceRoot") }}</span>
      <input v-model="state.workspaceRoot" name="workspaceRoot" type="text" />
    </label>

    <label class="ar-form__field">
      <span>{{ t("autoresearch.form.goal") }}</span>
      <textarea
        v-model="state.goal"
        name="goal"
        rows="2"
        :placeholder="t('autoresearch.form.goalPlaceholder')"
      />
    </label>

    <label class="ar-form__field">
      <span>{{ t("autoresearch.form.metricCommand") }}</span>
      <input
        v-model="state.metricCommand"
        name="metricCommand"
        type="text"
        placeholder="npm run bench"
      />
      <small>{{ t("autoresearch.form.metricCommandHint") }}</small>
    </label>

    <div class="ar-form__row">
      <label class="ar-form__field">
        <span>{{ t("autoresearch.form.metricParse") }}</span>
        <select v-model="state.metricParseKind" name="metricParseKind">
          <option v-for="kind in PARSE_KINDS" :key="kind" :value="kind">
            {{ t(`autoresearch.form.metricParse.${kind}`) }}
          </option>
        </select>
      </label>
      <label v-if="state.metricParseKind !== 'last_number'" class="ar-form__field">
        <span>{{ t("autoresearch.form.metricParseArgument") }}</span>
        <input
          v-model="state.metricParseArgument"
          name="metricParseArgument"
          type="text"
        />
      </label>
      <label class="ar-form__field">
        <span>{{ t("autoresearch.form.direction") }}</span>
        <select v-model="state.direction" name="direction">
          <option value="min">{{ t("autoresearch.form.direction.min") }}</option>
          <option value="max">{{ t("autoresearch.form.direction.max") }}</option>
        </select>
      </label>
    </div>

    <label class="ar-form__field">
      <span>{{ t("autoresearch.form.mutablePaths") }}</span>
      <textarea v-model="state.mutablePaths" name="mutablePaths" rows="2" />
      <small>{{ t("autoresearch.form.mutablePathsHint") }}</small>
    </label>

    <label class="ar-form__field">
      <span>{{ t("autoresearch.form.guardCommand") }}</span>
      <input
        v-model="state.guardCommand"
        name="guardCommand"
        type="text"
        placeholder="npm test"
      />
      <small>{{ t("autoresearch.form.guardCommandHint") }}</small>
    </label>

    <div class="ar-form__row">
      <label class="ar-form__field">
        <span>{{ t("autoresearch.form.repeats") }}</span>
        <input v-model.number="state.repeats" name="repeats" type="number" min="1" />
      </label>
      <label class="ar-form__field">
        <span>{{ t("autoresearch.form.minImprovement") }}</span>
        <input
          v-model.number="state.minImprovementPct"
          name="minImprovementPct"
          type="number"
          min="0"
          step="0.1"
        />
      </label>
      <label class="ar-form__field">
        <span>{{ t("autoresearch.form.targetValue") }}</span>
        <input
          v-model="state.targetValue"
          name="targetValue"
          type="text"
          inputmode="decimal"
        />
      </label>
    </div>

    <div class="ar-form__row">
      <label class="ar-form__field">
        <span>{{ t("autoresearch.form.iterationBudget") }}</span>
        <input
          v-model.number="state.iterationBudget"
          name="iterationBudget"
          type="number"
          min="1"
          :max="MAX_ITERATION_BUDGET"
        />
      </label>
      <label class="ar-form__field">
        <span>{{ t("autoresearch.form.iterationTimeout") }}</span>
        <input
          v-model.number="state.iterationTimeoutSec"
          name="iterationTimeoutSec"
          type="number"
          min="1"
        />
      </label>
      <label class="ar-form__field">
        <span>{{ t("autoresearch.form.maxConsecutiveErrors") }}</span>
        <input
          v-model.number="state.maxConsecutiveErrors"
          name="maxConsecutiveErrors"
          type="number"
          min="1"
        />
      </label>
    </div>

    <p class="ar-form__hint">{{ t("autoresearch.form.modelNote") }}</p>
    <ul
      v-if="shownProblems.length"
      class="ar-form__problems"
      data-testid="form-problems"
    >
      <li v-for="problem in shownProblems" :key="problem">{{ t(problem) }}</li>
    </ul>
    <p v-if="error" class="ar-form__error" data-testid="form-error">{{ error }}</p>
    <button class="ar-form__submit" type="submit" :disabled="busy">
      {{ busy ? t("autoresearch.form.starting") : t("autoresearch.form.start") }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import {
  MAX_ITERATION_BUDGET,
  defaultAutoresearchForm,
  validateAutoresearchForm,
  type AutoresearchFormState,
  type MetricParseKind,
} from "./model/form";

const props = defineProps<{ workspaceRoot: string; busy: boolean; error: string }>();
const emit = defineEmits<{ submit: [state: AutoresearchFormState] }>();
const { t } = useI18n();

const PARSE_KINDS: MetricParseKind[] = ["last_number", "regex", "json"];

const state = reactive<AutoresearchFormState>(
  defaultAutoresearchForm(props.workspaceRoot),
);
const attempted = ref(false);
const problems = computed(() => validateAutoresearchForm(state));
const shownProblems = computed(() => (attempted.value ? problems.value : []));

function submit(): void {
  attempted.value = true;
  if (problems.value.length) return;
  emit("submit", { ...state });
}
</script>

<style scoped>
.ar-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ar-form__title {
  margin: 0;
  font-size: 15px;
}

.ar-form__note {
  margin: 0;
  padding: 8px 10px;
  border: 1px solid var(--c-warning-border);
  border-radius: var(--radius);
  background: var(--c-warning-bg);
  color: var(--c-warning-text);
  font-size: 12px;
}

.ar-form__row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ar-form__row .ar-form__field {
  flex: 1 1 160px;
}

.ar-form__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.ar-form__field small,
.ar-form__hint {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
}

.ar-form__field input,
.ar-form__field select,
.ar-form__field textarea {
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-input);
  color: var(--text);
  font: inherit;
}

.ar-form__problems,
.ar-form__error {
  margin: 0;
  color: var(--danger);
  font-size: 12px;
}

.ar-form__submit {
  align-self: flex-start;
  padding: 6px 16px;
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius);
  background: var(--accent-primary);
  color: var(--bg1);
  cursor: pointer;
}

.ar-form__submit:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
