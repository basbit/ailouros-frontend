import { ref } from "vue";

export function createGateRefs() {
  const humanGateVisible = ref(false);
  const humanGateTitle = ref("Awaiting operator input");
  const humanGateFeedback = ref("");
  const humanGateSubmitting = ref(false);

  const shellGateVisible = ref(false);
  const shellGateCommands = ref<string[]>([]);
  const shellGateNeedsAllowlist = ref<string[]>([]);
  const shellGateAlreadyAllowed = ref<string[]>([]);

  const manualShellGateVisible = ref(false);
  const manualShellCommands = ref<string[]>([]);
  const manualShellReason = ref("");

  const retryGateVisible = ref(false);
  const retryFailedStep = ref("(unknown)");

  const blockedReason = ref<string | null>(null);
  const blockedCode = ref<string | null>(null);
  const blockedStep = ref<string | null>(null);

  return {
    humanGateVisible,
    humanGateTitle,
    humanGateFeedback,
    humanGateSubmitting,
    shellGateVisible,
    shellGateCommands,
    shellGateNeedsAllowlist,
    shellGateAlreadyAllowed,
    manualShellGateVisible,
    manualShellCommands,
    manualShellReason,
    retryGateVisible,
    retryFailedStep,
    blockedReason,
    blockedCode,
    blockedStep,
  };
}

export function resetGateRefs(gates: ReturnType<typeof createGateRefs>): void {
  gates.humanGateVisible.value = false;
  gates.humanGateTitle.value = "Awaiting operator input";
  gates.humanGateFeedback.value = "";
  gates.humanGateSubmitting.value = false;
  gates.shellGateVisible.value = false;
  gates.shellGateCommands.value = [];
  gates.shellGateNeedsAllowlist.value = [];
  gates.shellGateAlreadyAllowed.value = [];
  gates.manualShellGateVisible.value = false;
  gates.manualShellCommands.value = [];
  gates.manualShellReason.value = "";
  gates.retryGateVisible.value = false;
  gates.retryFailedStep.value = "(unknown)";
  gates.blockedReason.value = null;
  gates.blockedCode.value = null;
  gates.blockedStep.value = null;
}
