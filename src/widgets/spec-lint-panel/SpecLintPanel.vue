<template>
  <section class="spec-lint-panel" :aria-label="t('specLint.cardAria')">
    <header class="spec-lint-panel__header">
      <h3 class="spec-lint-panel__title">
        {{ t("specLint.headline") }}
      </h3>
    </header>

    <label class="spec-lint-panel__field">
      {{ t("specLint.scenarioLabel") }}
      <input
        v-model.trim="scenario"
        type="text"
        class="spec-lint-panel__input"
        :placeholder="t('specLint.scenarioPlaceholder')"
      />
    </label>
    <label class="spec-lint-panel__field">
      {{ t("specLint.specLabel") }}
      <textarea
        v-model="specText"
        class="spec-lint-panel__textarea"
        rows="6"
        :placeholder="t('specLint.specPlaceholder')"
      />
    </label>

    <div class="spec-lint-panel__actions">
      <button
        type="button"
        class="spec-lint-panel__btn"
        :disabled="!canRun"
        @click="onRun"
      >
        {{ linter.loading.value ? t("specLint.running") : t("specLint.run") }}
      </button>
    </div>

    <p v-if="linter.lastError.value" class="spec-lint-panel__error">
      {{ linter.lastError.value }}
    </p>

    <div v-if="report" class="spec-lint-panel__report">
      <p class="spec-lint-panel__summary">
        {{
          t("specLint.summary", {
            scenario: report.scenario,
            errors: report.counts.error ?? 0,
            warnings: report.counts.warning ?? 0,
            info: report.counts.info ?? 0,
            blocking: report.blockingCount,
          })
        }}
      </p>
      <ul v-if="report.findings.length > 0" class="spec-lint-panel__findings">
        <li
          v-for="finding in report.findings"
          :key="`${finding.ruleId}:${finding.spanStart}`"
          class="spec-lint-panel__finding"
          :class="`spec-lint-panel__finding--${finding.severity}`"
        >
          <div class="spec-lint-panel__finding-head">
            <span
              class="spec-lint-panel__severity"
              :class="`spec-lint-panel__severity--${finding.severity}`"
            >
              {{ finding.severity }}
            </span>
            <code class="spec-lint-panel__rule">{{ finding.ruleId }}</code>
          </div>
          <p class="spec-lint-panel__message">{{ finding.message }}</p>
        </li>
      </ul>
      <p v-else class="spec-lint-panel__empty">
        {{ t("specLint.noFindings") }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { useSpecLinter } from "@/features/spec-linter/useSpecLinter";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{ defaultScenario?: string }>();

const { t } = useI18n();
const linter = useSpecLinter();
const scenario = ref(props.defaultScenario ?? "default");
const specText = ref("");
const report = computed(() => linter.report.value);

const canRun = computed(
  () =>
    !linter.loading.value &&
    scenario.value.length > 0 &&
    specText.value.trim().length > 0,
);

async function onRun(): Promise<void> {
  if (!canRun.value) return;
  await linter.run({ scenario: scenario.value, specText: specText.value });
}
</script>

<style scoped>
.spec-lint-panel {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spec-lint-panel__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.spec-lint-panel__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--ink-3);
}

.spec-lint-panel__input,
.spec-lint-panel__textarea {
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 6px 8px;
  font-size: 13px;
  color: var(--ink);
  font-family: inherit;
  resize: vertical;
}

.spec-lint-panel__actions {
  display: flex;
  gap: 8px;
}

.spec-lint-panel__btn {
  appearance: none;
  background: var(--accent);
  color: #fff;
  border: 1px solid transparent;
  border-radius: var(--r-md);
  padding: 6px 14px;
  font-size: 12px;
  cursor: pointer;
}

.spec-lint-panel__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.spec-lint-panel__error {
  margin: 0;
  font-size: 12px;
  color: var(--error);
}

.spec-lint-panel__summary {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}

.spec-lint-panel__findings {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.spec-lint-panel__finding {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 6px 10px;
  background: var(--bg-elev);
}

.spec-lint-panel__finding--error {
  border-color: color-mix(in srgb, var(--error) 30%, var(--line));
}

.spec-lint-panel__finding--warning {
  border-color: color-mix(in srgb, var(--warning) 30%, var(--line));
}

.spec-lint-panel__finding-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.spec-lint-panel__severity {
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: var(--r-sm);
  font-size: 10px;
}

.spec-lint-panel__severity--error {
  color: var(--error);
  background: color-mix(in srgb, var(--error) 16%, transparent);
}

.spec-lint-panel__severity--warning {
  color: var(--warning);
  background: color-mix(in srgb, var(--warning) 16%, transparent);
}

.spec-lint-panel__severity--info {
  color: var(--ink-3);
  background: color-mix(in srgb, var(--ink-3) 14%, transparent);
}

.spec-lint-panel__rule {
  font-family: var(--font-mono);
  color: var(--ink-3);
}

.spec-lint-panel__message {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ink-2);
  line-height: 1.4;
}

.spec-lint-panel__empty {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
  font-style: italic;
}
</style>
