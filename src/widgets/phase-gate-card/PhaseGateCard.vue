<template>
  <section
    v-if="isVisible"
    class="phase-gate-card"
    :aria-label="t('phaseGates.cardAria')"
  >
    <header class="phase-gate-card__header">
      <h3 class="phase-gate-card__title">
        {{ t("phaseGates.headline") }}
      </h3>
      <button
        type="button"
        class="phase-gate-card__refresh"
        :disabled="gates.loading.value || !workspaceRoot"
        @click="onRefresh"
      >
        {{ gates.loading.value ? t("phaseGates.refreshing") : t("phaseGates.refresh") }}
      </button>
    </header>

    <p v-if="gates.lastError.value" class="phase-gate-card__error">
      {{ gates.lastError.value }}
    </p>

    <ol v-if="filteredGates.length > 0" class="phase-gate-card__list">
      <li
        v-for="gate in filteredGates"
        :key="gate.gateId"
        class="phase-gate-card__gate"
      >
        <div class="phase-gate-card__gate-head">
          <span class="phase-gate-card__phase">{{ gate.phaseId }}</span>
          <code class="phase-gate-card__gate-id">{{ gate.gateId }}</code>
        </div>
        <p class="phase-gate-card__question">{{ t("phaseGates.question") }}</p>
        <p v-if="gate.summary" class="phase-gate-card__summary">
          {{ gate.summary }}
        </p>
        <template v-if="gate.acceptanceCriteria.length > 0">
          <p class="phase-gate-card__criteria-label">
            {{ t("phaseGates.optionsLabel") }}
          </p>
          <ul class="phase-gate-card__criteria">
            <li v-for="criterion in gate.acceptanceCriteria" :key="criterion">
              {{ criterion }}
            </li>
          </ul>
        </template>
        <label class="phase-gate-card__field">
          {{ t("phaseGates.rationaleLabel") }}
          <textarea
            v-model.trim="rationaleByGate[gate.gateId]"
            class="phase-gate-card__textarea"
            rows="2"
            :placeholder="t('phaseGates.rationalePlaceholder')"
          />
        </label>
        <PhaseGateDecisionActions
          :disabled="!canDecide(gate.gateId)"
          @decide="(decision) => onDecide(gate, decision)"
        />
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";

import type { PhaseGate, PhaseGateDecision } from "@/shared/model/phase-gate-types";
import { usePhaseGatePolling, usePhaseGates } from "@/entities/phase-gate";
import { useI18n } from "@/shared/lib/i18n";
import PhaseGateDecisionActions from "./PhaseGateDecisionActions.vue";

const props = withDefaults(
  defineProps<{
    workspaceRoot: string | null;
    taskId?: string | null;
  }>(),
  {
    taskId: null,
  },
);

const { t } = useI18n();
const gates = usePhaseGates();

const filteredGates = computed(() => {
  const all = gates.pendingGates.value;
  if (!props.taskId) return all;
  return all.filter((gate) => gate.taskId === props.taskId);
});

// Only a human ever decides a gate, so there is nothing to ask for. This used
// to be a required text field that disabled the approve/reject buttons until
// it was filled in.
const rationaleByGate = reactive<Record<string, string>>({});

// Gates only exist for scenarios that run phase_acceptance_gate with phase
// verification on. Polling keeps running while hidden, so the card surfaces
// itself the moment a gate opens.
const isVisible = computed(
  () => filteredGates.value.length > 0 || Boolean(gates.lastError.value),
);

usePhaseGatePolling(() => props.workspaceRoot);

function canDecide(gateId: string): boolean {
  if (gates.decidingGateId.value === gateId) return false;
  return Boolean(props.workspaceRoot);
}

async function onRefresh(): Promise<void> {
  if (!props.workspaceRoot) return;
  await gates.refresh(props.workspaceRoot);
}

async function onDecide(gate: PhaseGate, decision: PhaseGateDecision): Promise<void> {
  if (!props.workspaceRoot) return;
  const rationale = (rationaleByGate[gate.gateId] ?? "").trim();
  const ok = await gates.decide(gate.gateId, {
    workspaceRoot: props.workspaceRoot,
    decision,
    rationale,
  });
  if (ok) {
    delete rationaleByGate[gate.gateId];
  }
}
</script>

<style scoped>
.phase-gate-card {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.phase-gate-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.phase-gate-card__title {
  flex: 1 1 auto;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.phase-gate-card__refresh {
  appearance: none;
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 4px 10px;
  font-size: 12px;
  color: var(--ink);
  cursor: pointer;
}

.phase-gate-card__refresh:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.phase-gate-card__error {
  margin: 0;
  font-size: 12px;
  color: var(--error);
}

.phase-gate-card__hint,
.phase-gate-card__empty {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
  font-style: italic;
}

.phase-gate-card__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.phase-gate-card__gate {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 10px 12px;
  background: var(--bg-elev);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.phase-gate-card__gate-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.phase-gate-card__phase {
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent);
  padding: 2px 6px;
  border-radius: var(--r-sm);
}

.phase-gate-card__gate-id {
  flex: 1 1 auto;
  font-family: var(--font-mono);
  color: var(--ink-3);
  word-break: break-all;
}

.phase-gate-card__question {
  margin: 0;
  font-weight: 600;
}

.phase-gate-card__criteria-label {
  margin: 8px 0 2px;
  font-size: 12px;
  opacity: 0.75;
}

.phase-gate-card__summary {
  margin: 0;
  font-size: 12px;
  color: var(--ink-2);
  line-height: 1.4;
}

.phase-gate-card__criteria {
  list-style: disc;
  padding-left: 18px;
  margin: 0;
  font-size: 12px;
  color: var(--ink-2);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.phase-gate-card__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--ink-3);
}

.phase-gate-card__textarea {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 6px 8px;
  font-size: 13px;
  color: var(--ink);
  font-family: inherit;
  resize: vertical;
}

</style>
