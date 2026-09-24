<template>
  <div class="phase-gate-actions">
    <button
      type="button"
      class="phase-gate-actions__btn phase-gate-actions__btn--approve"
      data-testid="phase-gate-approve"
      :disabled="disabled"
      @click="emit('decide', 'approved')"
    >
      {{ t("phaseGates.approve") }}
    </button>
    <button
      type="button"
      class="phase-gate-actions__btn phase-gate-actions__btn--changes"
      data-testid="phase-gate-request-changes"
      :disabled="disabled"
      @click="emit('decide', 'changes_requested')"
    >
      {{ t("phaseGates.requestChanges") }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { PhaseGateDecision } from "@/shared/model/phase-gate-types";
import { useI18n } from "@/shared/lib/i18n";

defineProps<{ disabled: boolean }>();

const emit = defineEmits<{
  decide: [decision: PhaseGateDecision];
}>();

const { t } = useI18n();
</script>

<style scoped>
.phase-gate-actions {
  display: flex;
  gap: 8px;
}

.phase-gate-actions__btn {
  appearance: none;
  background: var(--bg-elev);
  border: 1px solid var(--line);
  color: var(--ink);
  border-radius: var(--r-md);
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}

.phase-gate-actions__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.phase-gate-actions__btn--approve:not(:disabled) {
  border-color: color-mix(in srgb, var(--success) 35%, var(--line));
  color: var(--success);
}

.phase-gate-actions__btn--changes:not(:disabled) {
  border-color: color-mix(in srgb, var(--warning) 35%, var(--line));
  color: var(--warning);
}
</style>
