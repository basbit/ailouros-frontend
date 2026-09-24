import { computed, onActivated, onBeforeUnmount, onDeactivated, readonly, ref, watch } from "vue";

import type { PhaseGate, PhaseGateDecision } from "@/shared/model/phase-gate-types";
import {
  decidePhaseGate,
  listPendingPhaseGates,
} from "@/shared/api/endpoints/phase-gates";
import { frontendLogger } from "@/shared/lib/frontend-logger";

/**
 * Who a gate decision is recorded as. Only a human ever decides a gate, and
 * every surface (the card, the chat feed) must report the same actor.
 */
export const PHASE_GATE_DECIDED_BY = "human";

export const PHASE_GATE_POLL_INTERVAL_MS = 3000;

const pendingGates = ref<PhaseGate[]>([]);
const loading = ref(false);
const decidingGateId = ref<string | null>(null);
const lastError = ref<string | null>(null);

// One request per workspace at a time: several consumers (the chat page, the
// pipeline bar of every turn, the run page card) refreshing at once used to
// fire the same GET as many times.
let inflightRefresh: Promise<void> | null = null;
let inflightRoot = "";

// One interval for the whole app, ref-counted by subscribers. Each consumer
// that mounted its own timer polled independently, so /pending was hit once
// per consumer per tick.
let pollTimer: ReturnType<typeof setInterval> | null = null;
let pollRoot = "";
const pollSubscribers = new Map<symbol, string>();

export function resetPhaseGates(): void {
  pendingGates.value = [];
  loading.value = false;
  decidingGateId.value = null;
  lastError.value = null;
  inflightRefresh = null;
  inflightRoot = "";
  stopSharedPolling();
  pollSubscribers.clear();
}

async function refresh(workspaceRoot: string): Promise<void> {
  const trimmedRoot = workspaceRoot.trim();
  if (!trimmedRoot) return;
  if (inflightRefresh && inflightRoot === trimmedRoot) return inflightRefresh;
  inflightRoot = trimmedRoot;
  inflightRefresh = runRefresh(trimmedRoot).finally(() => {
    if (inflightRoot === trimmedRoot) {
      inflightRefresh = null;
      inflightRoot = "";
    }
  });
  return inflightRefresh;
}

async function runRefresh(trimmedRoot: string): Promise<void> {
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
    rationale?: string;
  },
): Promise<boolean> {
  decidingGateId.value = gateId;
  lastError.value = null;
  try {
    const updated = await decidePhaseGate(gateId, {
      workspaceRoot: input.workspaceRoot,
      decision: input.decision,
      decidedBy: PHASE_GATE_DECIDED_BY,
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

function stopSharedPolling(): void {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  pollRoot = "";
}

function syncSharedPolling(): void {
  const roots = [...pollSubscribers.values()].filter((root) => root);
  const nextRoot = roots[roots.length - 1] ?? "";
  if (!nextRoot) {
    stopSharedPolling();
    return;
  }
  if (nextRoot === pollRoot && pollTimer !== null) return;
  stopSharedPolling();
  pollRoot = nextRoot;
  void refresh(nextRoot);
  pollTimer = setInterval(() => {
    void refresh(nextRoot);
  }, PHASE_GATE_POLL_INTERVAL_MS);
}

/**
 * Keep the pending list fresh for `workspaceRoot` while the calling component
 * is mounted and active. Subscribers share one interval; the last one to
 * unsubscribe stops it.
 */
export function usePhaseGatePolling(workspaceRoot: () => string | null | undefined): void {
  const token = Symbol("phase-gate-poll");

  function subscribe(): void {
    pollSubscribers.set(token, (workspaceRoot() ?? "").trim());
    syncSharedPolling();
  }

  function unsubscribe(): void {
    if (!pollSubscribers.delete(token)) return;
    syncSharedPolling();
  }

  watch(() => (workspaceRoot() ?? "").trim(), subscribe, { immediate: true });
  onBeforeUnmount(unsubscribe);
  onDeactivated(unsubscribe);
  onActivated(subscribe);
}

export function usePhaseGates() {
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
