<template>
  <section class="tokens-tab" :aria-label="t('history.detail.tab.tokens')">
    <p v-if="loading" class="tokens-tab__hint">{{ t("tokens.loading") }}</p>
    <p v-else-if="lastError" class="tokens-tab__error">{{ lastError }}</p>
    <p v-else-if="!metrics" class="tokens-tab__hint">{{ t("tokens.empty") }}</p>

    <div v-else class="tokens-tab__body">
      <div class="tokens-tab__summary">
        <div class="tokens-tab__stat">
          <span class="tokens-tab__label">{{ t("tokens.totalInput") }}</span>
          <span class="tokens-tab__value">{{
            formatNumber(metrics.totalInputTokens)
          }}</span>
        </div>
        <div class="tokens-tab__stat">
          <span class="tokens-tab__label">{{ t("tokens.medianStep") }}</span>
          <span class="tokens-tab__value">{{
            formatNumber(metrics.medianSmallStepInputTokens)
          }}</span>
        </div>
        <div class="tokens-tab__stat">
          <span class="tokens-tab__label">{{ t("tokens.cacheHits") }}</span>
          <span class="tokens-tab__value">{{
            formatNumber(metrics.fileReadCacheHits)
          }}</span>
        </div>
        <div class="tokens-tab__stat">
          <span class="tokens-tab__label">{{ t("tokens.cacheRate") }}</span>
          <span class="tokens-tab__value"
            >{{ (metrics.fileReadCacheHitRate * 100).toFixed(1) }}%</span
          >
        </div>
      </div>

      <h4 class="tokens-tab__subtitle">{{ t("tokens.perStep") }}</h4>
      <ul class="tokens-tab__list">
        <li v-for="entry in metrics.steps" :key="entry.stepId" class="tokens-tab__row">
          <code class="tokens-tab__step">{{ entry.stepId }}</code>
          <span class="tokens-tab__reason">
            in {{ formatNumber(entry.inputTokens) }} · out
            {{ formatNumber(entry.outputTokens) }} · tools
            {{ formatNumber(entry.toolCalls) }}
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";

import { useI18n } from "@/shared/lib/i18n";
import { useTokenMetrics } from "@/features/token-metrics/useTokenMetrics";

const props = defineProps<{
  taskId: string | null;
}>();

const { t } = useI18n();
const store = useTokenMetrics();
const metrics = computed(() => store.metrics.value);
const loading = computed(() => store.loading.value);
const lastError = computed(() => store.lastError.value);

function formatNumber(value: number): string {
  return value.toLocaleString();
}

async function refresh(): Promise<void> {
  if (!props.taskId) return;
  await store.refresh({ taskId: props.taskId });
}

onMounted(() => {
  void refresh();
});

watch(
  () => props.taskId,
  () => {
    void refresh();
  },
);
</script>

<style scoped>
.tokens-tab {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.tokens-tab__hint {
  margin: 0;
  font-size: 13px;
  color: var(--ink-3);
}

.tokens-tab__error {
  margin: 0;
  font-size: 13px;
  color: var(--error);
}

.tokens-tab__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tokens-tab__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.tokens-tab__stat {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--card);
}

.tokens-tab__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-3);
}

.tokens-tab__value {
  font-family: var(--font-mono);
  font-size: 18px;
  color: var(--ink);
}

.tokens-tab__subtitle {
  font-size: 13px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.tokens-tab__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tokens-tab__row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: baseline;
  font-size: 12px;
}

.tokens-tab__step {
  font-family: var(--font-mono);
  color: var(--ink-2);
}

.tokens-tab__reason {
  font-size: 11px;
  color: var(--ink-3);
}
</style>
