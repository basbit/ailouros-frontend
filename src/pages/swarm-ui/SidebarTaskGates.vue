<template>
  <div class="sidebar-task-gates">
    <HumanGate
      :visible="ui.humanGateVisible"
      :title="ui.humanGateTitle"
      :feedback="ui.humanGateFeedback"
      :task-id="ui.taskId ?? undefined"
      :submitting="ui.humanGateSubmitting"
      @update:feedback="ui.humanGateFeedback = $event"
      @submit="(feedback) => emit('human-resume', feedback)"
    />

    <ShellGate
      :visible="ui.shellGateVisible"
      :commands="ui.shellGateCommands"
      :needs-allowlist="ui.shellGateNeedsAllowlist"
      :already-allowed="ui.shellGateAlreadyAllowed"
      @confirm="(allow) => emit('confirm-shell', allow)"
    />

    <ManualShellGate
      :visible="ui.manualShellGateVisible"
      :commands="ui.manualShellCommands"
      :reason="ui.manualShellReason"
      :sudo-prompt-available="!!manualSudoCommand"
      @open-sudo-prompt="emit('open-sudo-prompt')"
      @confirm="(done) => emit('confirm-manual-shell', done)"
    />

    <RetryGate
      :visible="ui.retryGateVisible"
      :failed-step="ui.retryFailedStep"
      :current-pipeline-steps="currentPipelineSteps"
      @retry="(fromBeginning) => emit('retry', fromBeginning)"
      @continue-pipeline="(steps) => emit('continue-pipeline', steps)"
    />

    <PromptAssistantDialog
      :open="promptCoachOpen"
      @close="emit('update:prompt-coach-open', false)"
      @apply="(body) => emit('prompt-coach-apply', body)"
    />
  </div>
</template>

<script setup lang="ts">
import HumanGate from "@/features/task-gate/HumanGate.vue";
import ShellGate from "@/features/task-gate/ShellGate.vue";
import ManualShellGate from "@/features/task-gate/ManualShellGate.vue";
import RetryGate from "@/features/task-gate/RetryGate.vue";
import PromptAssistantDialog from "@/widgets/prompt-assistant/PromptAssistantDialog.vue";
import { useUiStore } from "@/shared/store/ui";

defineProps<{
  manualSudoCommand: string;
  currentPipelineSteps: string[];
  promptCoachOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "human-resume", feedback: string): void;
  (e: "confirm-shell", allow: boolean): void;
  (e: "open-sudo-prompt"): void;
  (e: "confirm-manual-shell", done: boolean): void;
  (e: "retry", fromBeginning: boolean): void;
  (e: "continue-pipeline", additionalSteps: string[]): void;
  (e: "update:prompt-coach-open", open: boolean): void;
  (e: "prompt-coach-apply", body: string): void;
}>();

const ui = useUiStore();
</script>

<style scoped>
.sidebar-task-gates {
  display: contents;
}
</style>
