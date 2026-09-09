<template>
  <div
    class="task-gates-overlay"
    :class="{ 'attention-required--glow': isAnyGateVisible }"
  >
    <!-- Coworking Gate Claiming Status Bar -->
    <div v-if="isAnyGateVisible && ui.taskId" class="coworking-gate-bar">
      <div
        v-if="isClaimedByOther"
        class="coworking-gate-bar__status coworking-gate-bar__status--locked"
      >
        <span class="coworking-gate-bar__icon">🔒</span>
        <span>
          {{ t("coworking.claimedBy", { user: currentClaim?.userName }) }}
        </span>
      </div>
      <div
        v-else-if="isClaimedByMe"
        class="coworking-gate-bar__status coworking-gate-bar__status--mine"
      >
        <span class="coworking-gate-bar__icon">🔒</span>
        <span>{{ t("coworking.claimedByMe") }}</span>
        <button
          type="button"
          class="coworking-gate-bar__btn"
          @click="coworking.releaseGate(ui.taskId)"
        >
          {{ t("coworking.releaseGate") }}
        </button>
      </div>
      <div v-else class="coworking-gate-bar__status coworking-gate-bar__status--free">
        <span class="coworking-gate-bar__icon">🔓</span>
        <span>{{ t("coworking.unclaimed") }}</span>
        <button
          type="button"
          class="coworking-gate-bar__btn coworking-gate-bar__btn--claim"
          @click="coworking.claimGate(ui.taskId)"
        >
          {{ t("coworking.claimGate") }}
        </button>
      </div>
    </div>

    <HumanGate
      :visible="ui.humanGateVisible"
      :title="ui.humanGateTitle"
      :feedback="ui.humanGateFeedback"
      :task-id="ui.taskId ?? undefined"
      :submitting="ui.humanGateSubmitting"
      @submit="emit('human-resume', $event)"
      @update:feedback="ui.humanGateFeedback = $event"
    />
    <ShellGate
      :visible="ui.shellGateVisible"
      :commands="ui.shellGateCommands"
      :needs-allowlist="ui.shellGateNeedsAllowlist"
      :already-allowed="ui.shellGateAlreadyAllowed"
      @confirm="emit('confirm-shell', $event)"
    />
    <ManualShellGate
      :visible="ui.manualShellGateVisible"
      :commands="ui.manualShellCommands"
      :reason="ui.manualShellReason"
      @confirm="emit('confirm-manual-shell', $event)"
    />
    <RetryGate
      :visible="ui.retryGateVisible"
      :failed-step="ui.retryFailedStep"
      :current-pipeline-steps="currentPipelineSteps"
      @retry="emit('retry', $event)"
      @continue-pipeline="emit('continue-pipeline', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import HumanGate from "./HumanGate.vue";
import ShellGate from "./ShellGate.vue";
import ManualShellGate from "./ManualShellGate.vue";
import RetryGate from "./RetryGate.vue";
import { useUiStore } from "@/shared/store/ui";
import { useCoworking } from "@/entities/coworking/useCoworking";
import { useI18n } from "@/shared/lib/i18n";

defineProps<{ currentPipelineSteps: string[] }>();

const emit = defineEmits<{
  "human-resume": [feedback: string];
  "confirm-shell": [approved: boolean];
  "confirm-manual-shell": [done: boolean];
  retry: [fromBeginning: boolean];
  "continue-pipeline": [additionalSteps: string[]];
}>();

const ui = useUiStore();
const coworking = useCoworking();
const { t } = useI18n();

const currentClaim = computed(() => {
  return ui.taskId ? coworking.gateClaims.value.get(ui.taskId) : null;
});

const isClaimedByMe = computed(() => {
  return currentClaim.value?.userId === coworking.localUser.value.id;
});

const isClaimedByOther = computed(() => {
  return Boolean(currentClaim.value && !isClaimedByMe.value);
});

const isAnyGateVisible = computed(
  () =>
    ui.humanGateVisible ||
    ui.shellGateVisible ||
    ui.manualShellGateVisible ||
    ui.retryGateVisible,
);
</script>

<style scoped>
.coworking-gate-bar {
  margin-bottom: 10px;
}

.coworking-gate-bar__status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 550;
  gap: 8px;
}

.coworking-gate-bar__status--locked {
  background: color-mix(in srgb, var(--error, #ef4444) 15%, transparent);
  border: 1px solid var(--error, #ef4444);
  color: var(--error, #ef4444);
}

.coworking-gate-bar__status--mine {
  background: color-mix(in srgb, var(--ok, #10b981) 15%, transparent);
  border: 1px solid var(--ok, #10b981);
  color: var(--ok, #10b981);
}

.coworking-gate-bar__status--free {
  background: var(--bg-2, #24242e);
  border: 1px solid var(--line, #333);
  color: var(--ink-2, #aaa);
}

.coworking-gate-bar__btn {
  background: transparent;
  border: 1px solid currentColor;
  color: inherit;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.coworking-gate-bar__btn:hover {
  opacity: 0.8;
}

.coworking-gate-bar__btn--claim {
  background: var(--accent, #6366f1);
  border-color: var(--accent, #6366f1);
  color: #fff;
}
</style>
