<template>
  <div class="scenario-estimate" data-testid="scenario-estimate">
    <div class="scenario-estimate__head">
      <span class="scenario-estimate__label">
        {{ t("scenarios.estimate.title") }}
      </span>
      <span v-if="loading" class="scenario-estimate__status">
        {{ t("scenarios.estimate.loading") }}
      </span>
    </div>
    <p v-if="error" class="scenario-estimate__error">{{ error }}</p>
    <template v-else-if="estimate">
      <div class="scenario-estimate__totals">
        <span class="scenario-estimate__badge">
          {{ t("scenarios.estimate.total", { value: totalLabel }) }}
        </span>
        <span class="scenario-estimate__badge">
          {{ t("scenarios.estimate.essential", { value: essentialLabel }) }}
        </span>
      </div>
      <label class="scenario-estimate__skip-all">
        <input
          type="checkbox"
          :checked="skipAllNonEssential"
          :disabled="disabled || !hasOptionalSteps"
          @change="onToggleSkipAll(($event.target as HTMLInputElement).checked)"
        />
        <span>{{ t("scenarios.estimate.skipAll") }}</span>
      </label>
      <ul class="scenario-estimate__list">
        <li
          v-for="step in estimate.steps"
          :key="step.step_id"
          class="scenario-estimate__step"
        >
          <label class="scenario-estimate__row">
            <input
              type="checkbox"
              :checked="!skipSet.has(step.step_id)"
              :disabled="disabled || step.essential"
              :title="t('scenarios.estimate.skipStep')"
              @change="
                onToggleStep(step.step_id, ($event.target as HTMLInputElement).checked)
              "
            />
            <span class="scenario-estimate__step-id">{{ step.step_id }}</span>
            <span
              class="scenario-estimate__badge"
              :class="
                step.essential
                  ? 'scenario-estimate__badge--essential'
                  : 'scenario-estimate__badge--optional'
              "
            >
              {{
                step.essential
                  ? t("scenarios.estimate.stepEssential")
                  : t("scenarios.estimate.stepOptional")
              }}
            </span>
            <span class="scenario-estimate__duration">
              {{ formatDuration(step.estimated_duration_sec) }}
            </span>
          </label>
        </li>
      </ul>
    </template>
    <p v-else-if="notImplemented" class="scenario-estimate__empty">
      {{ t("scenarios.estimate.unknown") }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type { ScenarioEstimate } from "@/shared/model/scenario-types";

const props = withDefaults(
  defineProps<{
    estimate: ScenarioEstimate | null;
    loading: boolean;
    error: string | null;
    notImplemented: boolean;
    skipGates: string[];
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{
  "update:skipGates": [value: string[]];
}>();

const { t } = useI18n();

const skipSet = computed(() => new Set(props.skipGates));

const hasOptionalSteps = computed(() => {
  const list = props.estimate?.steps ?? [];
  return list.some((step) => !step.essential);
});

const skipAllNonEssential = computed(() => {
  if (!hasOptionalSteps.value) return false;
  const list = props.estimate?.steps ?? [];
  return list
    .filter((step) => !step.essential)
    .every((step) => skipSet.value.has(step.step_id));
});

function emitSkip(next: string[]): void {
  emit("update:skipGates", next);
}

function onToggleStep(stepId: string, keepEnabled: boolean): void {
  const list = props.estimate?.steps ?? [];
  const step = list.find((s) => s.step_id === stepId);
  if (!step || step.essential) return;
  const next = new Set(skipSet.value);
  if (keepEnabled) {
    next.delete(stepId);
  } else {
    next.add(stepId);
  }
  emitSkip(Array.from(next));
}

function onToggleSkipAll(skipAll: boolean): void {
  const list = props.estimate?.steps ?? [];
  const optional = list.filter((step) => !step.essential).map((step) => step.step_id);
  if (skipAll) {
    const next = new Set(skipSet.value);
    optional.forEach((id) => next.add(id));
    emitSkip(Array.from(next));
  } else {
    const optionalSet = new Set(optional);
    emitSkip(props.skipGates.filter((id) => !optionalSet.has(id)));
  }
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) {
    return t("scenarios.estimate.unknown");
  }
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (minutes < 60) return rem ? `${minutes}m ${rem}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const minRem = minutes % 60;
  return minRem ? `${hours}h ${minRem}m` : `${hours}h`;
}

const totalLabel = computed(() =>
  formatDuration(props.estimate?.total_seconds ?? null),
);

const essentialLabel = computed(() =>
  formatDuration(props.estimate?.essential_seconds ?? null),
);
</script>

<style scoped>
.scenario-estimate {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  padding: 8px;
  border: 1px dashed var(--border, #2a2f3e);
  border-radius: 8px;
}
.scenario-estimate__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.scenario-estimate__label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text2, #a8b0c4);
}
.scenario-estimate__status {
  font-size: 11px;
  color: var(--text2, #a8b0c4);
}
.scenario-estimate__error {
  margin: 0;
  font-size: 11px;
  color: var(--error, #d7563f);
}
.scenario-estimate__totals {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.scenario-estimate__badge {
  font-size: 10px;
  padding: 2px 6px;
  background: color-mix(in srgb, var(--text3, #6b7280) 25%, transparent);
  border-radius: 4px;
  color: var(--text2, #a8b0c4);
}
.scenario-estimate__badge--essential {
  background: color-mix(in srgb, #d7563f 25%, transparent);
  color: var(--text, #f5f0e7);
}
.scenario-estimate__badge--optional {
  background: color-mix(in srgb, #3b5bdb 25%, transparent);
  color: var(--text, #f5f0e7);
}
.scenario-estimate__empty {
  margin: 0;
  font-size: 11px;
  color: var(--text2, #a8b0c4);
  font-style: italic;
}
.scenario-estimate__skip-all {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text, #f5f0e7);
}
.scenario-estimate__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.scenario-estimate__row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text2, #a8b0c4);
}
.scenario-estimate__step-id {
  font-weight: 600;
  color: var(--text, #f5f0e7);
}
.scenario-estimate__duration {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}
</style>
