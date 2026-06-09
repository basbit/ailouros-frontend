import {
  parsePhaseGatePayload,
  type PhaseGate,
  type PhaseGateDecision,
} from "@/shared/model/phase-gate-types";
import { ApiError, httpGet, httpPost } from "@/shared/api/http";

export interface DecidePhaseGateInput {
  workspaceRoot: string;
  decision: PhaseGateDecision;
  decidedBy: string;
  rationale?: string;
}

export async function decidePhaseGate(
  gateId: string,
  input: DecidePhaseGateInput,
): Promise<PhaseGate> {
  const body = {
    workspace_root: input.workspaceRoot,
    decision: input.decision,
    decided_by: input.decidedBy,
    rationale: input.rationale ?? "",
  };
  const raw = await httpPost<Record<string, unknown>>(
    `/v1/phase_gates/${encodeURIComponent(gateId)}/decide`,
    body,
  );
  const parsed = parsePhaseGatePayload(raw);
  if (!parsed) {
    throw new ApiError(
      "decidePhaseGate returned a malformed payload",
      200,
      JSON.stringify(raw),
    );
  }
  return parsed;
}

export async function listPendingPhaseGates(
  workspaceRoot: string,
): Promise<PhaseGate[]> {
  const params = new URLSearchParams({ workspace_root: workspaceRoot });
  const raw = await httpGet<{ items?: unknown }>(
    `/v1/phase_gates/pending?${params.toString()}`,
  );
  if (!Array.isArray(raw.items)) return [];
  return raw.items
    .map(parsePhaseGatePayload)
    .filter((entry): entry is PhaseGate => entry !== null);
}
