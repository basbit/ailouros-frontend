import { computed, readonly, ref } from "vue";

import type { PhaseGate, PhaseGateDecision } from "@/shared/model/phase-gate-types";
import {
  decidePhaseGate,
  listPendingPhaseGates,
} from "@/shared/api/endpoints/phase-gates";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const pendingGates = ref<PhaseGate[]>([]);
const loading = ref(false);
const decidingGateId = ref<string | null>(null);
const lastError = ref<string | null>(null);

export function resetPhaseGates(): void {
  pendingGates.value = [];
  loading.value = false;
  decidingGateId.value = null;
  lastError.value = null;
}

export function usePhaseGates() {
  async function refresh(workspaceRoot: string): Promise<void> {
    const trimmedRoot = workspaceRoot.trim();
    if (!trimmedRoot) return;
    if (pendingGates.value.length === 0) {
      loading.value = true;
    }
    lastError.value = null;
    try {
      pendingGates.value = await listPendingPhaseGates(trimmedRoot);
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("phase-gates: refresh failed", { error: message });
      lastError.value = message;
    } finally {
      loading.value = false;
    }
  }

  async function decide(
    gateId: string,
    input: {
      workspaceRoot: string;
      decision: PhaseGateDecision;
      decidedBy: string;
      rationale?: string;
    },
  ): Promise<boolean> {
    decidingGateId.value = gateId;
    lastError.value = null;
    try {
      const updated = await decidePhaseGate(gateId, {
        workspaceRoot: input.workspaceRoot,
        decision: input.decision,
        decidedBy: input.decidedBy,
        rationale: input.rationale,
      });
      pendingGates.value = pendingGates.value.filter(
        (gate) => gate.gateId !== updated.gateId,
      );
      return true;
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("phase-gates: decide failed", {
        gateId,
        error: message,
      });
      lastError.value = message;
      return false;
    } finally {
      decidingGateId.value = null;
    }
  }

  return {
    pendingGates: readonly(pendingGates),
    loading: readonly(loading),
    decidingGateId: readonly(decidingGateId),
    lastError: readonly(lastError),
    visible: computed(() => pendingGates.value.length > 0),
    refresh,
    decide,
    clear: resetPhaseGates,
  };
}
