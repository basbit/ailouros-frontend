<template>
  <span
    class="history-detail-header__pill"
    :class="`history-detail-header__pill--${family}`"
  >
    {{ status || "—" }}
  </span>
  <button
    v-if="canShowResume"
    type="button"
    class="history-detail-header__resume-btn"
    :disabled="resumeBusy"
    :title="resumeTitle"
    @click="$emit('resume')"
  >
    {{ resumeLabel }}
    <span v-if="resumeStepId" class="history-detail-header__resume-step">
      · {{ resumeStepId }}
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  family: "ok" | "fail" | "warn" | "run" | "pending";
  status: string;
  canShowResume: boolean;
  resumeBusy: boolean;
  resumeStepId: string;
  resumeLabel: string;
  resumeTitle: string;
}>();

defineEmits<{ resume: [] }>();
</script>

<style scoped>
.history-detail-header__pill {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.history-detail-header__pill--ok {
  background: var(--ok-soft);
  color: var(--ok);
}

.history-detail-header__pill--fail {
  background: color-mix(in srgb, var(--error) 16%, transparent);
  color: var(--error);
}

.history-detail-header__pill--warn {
  background: rgba(201, 138, 26, 0.16);
  color: var(--warn);
}

.history-detail-header__pill--run {
  background: var(--accent-soft);
  color: var(--accent-2);
}

.history-detail-header__pill--pending {
  background: var(--card-soft);
  color: var(--ink-3);
}

.history-detail-header__resume-btn {
  appearance: none;
  padding: 6px 14px;
  border-radius: var(--r-sm);
  border: 1px solid var(--warn, #c98a1a);
  background: var(--warn-soft, rgba(201, 138, 26, 0.08));
  color: var(--warn, #c98a1a);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.history-detail-header__resume-btn:hover:not(:disabled) {
  background: var(--warn, #c98a1a);
  color: var(--card, #fff);
}

.history-detail-header__resume-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.history-detail-header__resume-step {
  font-weight: 400;
  opacity: 0.8;
  font-family: var(--font-mono, monospace);
}
</style>
