<template>
  <section v-if="isVisible" class="run-plan" :aria-label="t('runPlan.cardAria')">
    <header class="run-plan__header">
      <h3 class="run-plan__title">{{ t("runPlan.headline") }}</h3>
      <button
        type="button"
        class="run-plan__btn"
        :disabled="loading || !canFetch"
        @click="onRefresh"
      >
        {{ loading ? t("runPlan.refreshing") : t("runPlan.refresh") }}
      </button>
    </header>

    <p v-if="lastError" class="run-plan__error">{{ lastError }}</p>

    <ul v-if="plan && plan.available && plan.decisions.length" class="run-plan__list">
      <li
        v-for="decision in plan.decisions"
        :key="decision.stage"
        class="run-plan__row"
      >
        <span class="run-plan__stage">{{ decision.stage }}</span>
        <span class="run-plan__verdict" :data-verdict="decision.verdict">{{
          decision.verdict
        }}</span>
        <span class="run-plan__reason">
          {{ decision.reason }}
          <span v-if="decision.sourceRef" class="run-plan__source">
            ({{ t("runPlan.source") }}: {{ decision.sourceRef }})
          </span>
        </span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import { getRunPlan } from "@/shared/api/endpoints/run-plan";
import type { RunPlan } from "@/shared/model/run-plan-types";
import { useI18n } from "@/shared/lib/i18n";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const props = defineProps<{ taskId: string | null }>();
const emit = defineEmits<{ visibility: [visible: boolean] }>();

const { t } = useI18n();
const plan = ref<RunPlan | null>(null);
const loading = ref(false);
const lastError = ref<string | null>(null);

const canFetch = computed(() => Boolean(props.taskId));

// Only scenarios that run the orchestrator_plan step produce a plan; for the
// rest there is nothing to show, so the card stays out of the way.
const isVisible = computed(
  () =>
    Boolean(lastError.value) ||
    Boolean(plan.value?.available && plan.value.decisions.length),
);

watch(isVisible, (visible) => emit("visibility", visible), { immediate: true });

async function onRefresh(): Promise<void> {
  const taskId = (props.taskId ?? "").trim();
  if (!taskId || loading.value) return;
  loading.value = true;
  lastError.value = null;
  try {
    plan.value = await getRunPlan(taskId);
  } catch (requestError: unknown) {
    const message =
      requestError instanceof Error ? requestError.message : String(requestError);
    frontendLogger.warn("run-plan: refresh failed", { error: message });
    lastError.value = message;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (canFetch.value) void onRefresh();
});

watch(
  () => props.taskId,
  () => {
    if (canFetch.value) void onRefresh();
  },
);
</script>

<style scoped>
.run-plan {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.run-plan__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.run-plan__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.run-plan__btn {
  appearance: none;
  background: transparent;
  color: var(--ink-2);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.run-plan__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.run-plan__error {
  margin: 0;
  font-size: 12px;
  color: var(--error);
}

.run-plan__hint {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}

.run-plan__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.run-plan__row {
  display: grid;
  grid-template-columns: 96px 64px 1fr;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
}

.run-plan__stage {
  color: var(--ink);
  font-weight: 500;
}

.run-plan__verdict {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 11px;
}

.run-plan__verdict[data-verdict="RUN"] {
  color: var(--accent, #2563eb);
}

.run-plan__verdict[data-verdict="REUSE"] {
  color: var(--ok, #16a34a);
}

.run-plan__verdict[data-verdict="UPDATE"] {
  color: var(--warn, #d97706);
}

.run-plan__verdict[data-verdict="SKIP"] {
  color: var(--ink-3);
}

.run-plan__reason {
  color: var(--ink-2);
}

.run-plan__source {
  color: var(--ink-3);
}
</style>
