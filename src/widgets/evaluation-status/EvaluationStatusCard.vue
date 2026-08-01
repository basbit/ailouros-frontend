<template>
  <section class="eval-status" :aria-label="t('evaluationStatus.cardAria')">
    <header class="eval-status__header">
      <h3 class="eval-status__title">
        {{ t("evaluationStatus.headline") }}
      </h3>
      <button
        type="button"
        class="eval-status__btn"
        :disabled="store.loading.value"
        @click="store.refresh"
      >
        {{
          store.loading.value
            ? t("evaluationStatus.refreshing")
            : t("evaluationStatus.refresh")
        }}
      </button>
    </header>

    <p v-if="store.lastError.value" class="eval-status__error">
      {{ store.lastError.value }}
    </p>

    <p v-if="!status && !store.loading.value" class="eval-status__hint">
      {{ t("evaluationStatus.empty") }}
    </p>

    <div v-if="status" class="eval-status__body">
      <div class="eval-status__row">
        <span class="eval-status__label">
          {{ t("evaluationStatus.ragas") }}
        </span>
        <span
          class="eval-status__pill"
          :class="
            status.ragas.enabled ? 'eval-status__pill--on' : 'eval-status__pill--off'
          "
        >
          {{
            status.ragas.enabled
              ? t("evaluationStatus.enabled")
              : t("evaluationStatus.disabled")
          }}
        </span>
        <code class="eval-status__model">{{ status.ragas.judgeKind }}</code>
      </div>

      <div class="eval-status__row">
        <span class="eval-status__label">
          {{ t("evaluationStatus.telemetry") }}
        </span>
        <span
          class="eval-status__pill"
          :class="
            status.telemetry.enabled
              ? 'eval-status__pill--on'
              : 'eval-status__pill--off'
          "
        >
          {{
            status.telemetry.enabled
              ? t("evaluationStatus.enabled")
              : t("evaluationStatus.disabled")
          }}
        </span>
        <code class="eval-status__model">{{ status.telemetry.exporterKind }}</code>
        <span
          v-if="status.telemetry.enabled"
          class="eval-status__pill"
          :class="
            status.telemetry.readiness.exporting
              ? 'eval-status__pill--on'
              : 'eval-status__pill--off'
          "
        >
          {{
            status.telemetry.readiness.exporting
              ? t("evaluationStatus.telemetryExporting")
              : t("evaluationStatus.telemetryNotExporting")
          }}
        </span>
      </div>
      <div
        v-if="status.telemetry.enabled && !status.telemetry.readiness.exporting"
        class="eval-status__row"
      >
        <span class="eval-status__label"></span>
        <span class="eval-status__hint">{{ status.telemetry.readiness.reason }}</span>
      </div>

      <div class="eval-status__row">
        <span class="eval-status__label">
          {{ t("evaluationStatus.entailment") }}
        </span>
        <span
          class="eval-status__pill"
          :class="
            status.entailment.enabled
              ? 'eval-status__pill--on'
              : 'eval-status__pill--off'
          "
        >
          {{
            status.entailment.enabled
              ? t("evaluationStatus.enabled")
              : t("evaluationStatus.disabled")
          }}
        </span>
        <code class="eval-status__model">{{ status.entailment.judgeKind }}</code>
        <span class="eval-status__threshold">
          {{
            t("evaluationStatus.threshold", {
              threshold: status.entailment.threshold.toFixed(2),
            })
          }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";

import { useEvaluationStatus } from "@/features/evaluation-status/useEvaluationStatus";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
const store = useEvaluationStatus();
const status = computed(() => store.status.value);

onMounted(() => {
  if (!status.value) {
    void store.refresh();
  }
});
</script>

<style scoped>
.eval-status {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.eval-status__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.eval-status__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.eval-status__btn {
  appearance: none;
  background: transparent;
  color: var(--ink-2);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.eval-status__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.eval-status__error {
  margin: 0;
  font-size: 12px;
  color: var(--error);
}

.eval-status__hint {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}

.eval-status__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.eval-status__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
}

.eval-status__label {
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 11px;
  color: var(--ink-3);
  min-width: 96px;
}

.eval-status__pill {
  padding: 1px 8px;
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 11px;
}

.eval-status__pill--on {
  color: var(--success);
  background: color-mix(in srgb, var(--success) 14%, transparent);
}

.eval-status__pill--off {
  color: var(--ink-3);
  background: color-mix(in srgb, var(--ink-3) 12%, transparent);
}

.eval-status__model {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-3);
}

.eval-status__threshold {
  font-size: 11px;
  color: var(--ink-3);
}
</style>
