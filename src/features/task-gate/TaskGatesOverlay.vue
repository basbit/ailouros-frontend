<template>
  <div class="task-gates-overlay">
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
import HumanGate from "./HumanGate.vue";
import ShellGate from "./ShellGate.vue";
import ManualShellGate from "./ManualShellGate.vue";
import RetryGate from "./RetryGate.vue";
import { useUiStore } from "@/shared/store/ui";

defineProps<{ currentPipelineSteps: string[] }>();

const emit = defineEmits<{
  "human-resume": [feedback: string];
  "confirm-shell": [approved: boolean];
  "confirm-manual-shell": [done: boolean];
  retry: [fromBeginning: boolean];
  "continue-pipeline": [additionalSteps: string[]];
}>();

const ui = useUiStore();
</script>
