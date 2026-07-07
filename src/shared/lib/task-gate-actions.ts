import { ApiError } from "@/shared/api/http";
import { getTaskPipelinePlan } from "@/shared/api/endpoints/pipeline";
import type { ChatStreamEvent } from "@/shared/lib/chat-stream-events";
import { consumeSseStream } from "@/shared/lib/swarm-chat-stream";
import {
  getPendingHuman,
  getPendingManualShell,
  getPendingShell,
  postConfirmHuman,
  postConfirmManualShell,
  postConfirmShell,
  postHumanResumeStream,
  postRetryStream,
} from "@/shared/api/endpoints/task-gates";
import { buildAgentConfig, type AgentConfigSettings } from "@/shared/lib/agent-config";
import { runCatchingWarn } from "@/shared/lib/safe-async";
import { useI18n } from "@/shared/lib/i18n";

/**
 * Transport layer for task-gate actions. These functions perform HTTP/stream
 * work only and report failures through {@link GateActionResult}; the caller
 * owns the decision to surface errors to the user (e.g. via the UX store).
 */
export type GateActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const ok = <T>(data: T): GateActionResult<T> => ({ ok: true, data });
const fail = (error: string): GateActionResult<never> => ({ ok: false, error });

/**
 * Sentinel for "already surfaced elsewhere": buildAgentConfig writes its own
 * error message, so the caller must not double-notify. An empty error string
 * signals a silent failure the caller should swallow.
 */
const SILENT = fail("");

function noTaskIdMessage(): string {
  return useI18n().t("history.noTaskId");
}

function apiErrorMessage(error: unknown, prefix: string): string {
  if (error instanceof ApiError) {
    return `${prefix} HTTP ${error.status}${error.body ? ": " + error.body : ""}`;
  }
  return String(error);
}

async function drainStream(
  body: ReadableStream<Uint8Array> | null | undefined,
  onEvent?: (event: ChatStreamEvent) => void,
): Promise<void> {
  const reader = body?.getReader();
  if (!reader) return;
  if (onEvent) {
    await consumeSseStream(reader, onEvent);
    return;
  }
  while (true) {
    const { done } = await reader.read();
    if (done) break;
  }
}

export async function submitHumanResume(
  taskId: string,
  feedback: string,
  sendWsSubscribe: () => void,
  onEvent?: (event: ChatStreamEvent) => void,
  settings?: AgentConfigSettings,
): Promise<GateActionResult> {
  if (!taskId) return fail(noTaskIdMessage());
  // The disk snapshot stores agent_config with API keys redacted; resuming
  // with it alone 401s on cloud providers. Send the live config so the
  // backend can merge real credentials back in (same contract as retry).
  const agentConfig = settings ? buildAgentConfig(settings) : null;
  const response = await postHumanResumeStream(taskId, feedback, agentConfig);
  if (!response.ok) return fail("human-resume HTTP " + response.status);
  sendWsSubscribe();
  await drainStream(response.body, onEvent);
  return ok(undefined);
}

export async function confirmShell(
  taskId: string,
  approved: boolean,
): Promise<GateActionResult> {
  if (!taskId) return SILENT;
  try {
    await postConfirmShell(taskId, approved);
    return ok(undefined);
  } catch (error) {
    return fail(apiErrorMessage(error, "confirm-shell"));
  }
}

export interface PendingManualShellPayload {
  commands: string[];
  reason: string;
}

export async function fetchPendingManualShell(
  taskId: string,
): Promise<PendingManualShellPayload> {
  const empty: PendingManualShellPayload = { commands: [], reason: "" };
  return runCatchingWarn(
    async () => {
      const data = await getPendingManualShell(taskId);
      if (!data) return empty;
      return { commands: data.commands ?? [], reason: data.reason ?? "" };
    },
    empty,
    `fetchPendingManualShell: network error for task ${taskId}`,
  );
}

export async function confirmManualShell(
  taskId: string,
  done: boolean,
): Promise<GateActionResult> {
  if (!taskId) return SILENT;
  try {
    await postConfirmManualShell(taskId, done);
    return ok(undefined);
  } catch (error) {
    return fail(apiErrorMessage(error, "confirm-manual-shell"));
  }
}

export async function confirmHuman(
  taskId: string,
  approved: boolean,
  userInput = "",
): Promise<GateActionResult> {
  if (!taskId) return SILENT;
  try {
    await postConfirmHuman(taskId, approved, userInput);
    return ok(undefined);
  } catch (error) {
    return fail(apiErrorMessage(error, "confirm-human"));
  }
}

export interface PendingHumanResponse {
  context: string;
  pending: boolean;
  questions?: { index: number; text: string; options: string[] }[];
}

export async function fetchPendingHuman(
  taskId: string,
): Promise<PendingHumanResponse | null> {
  return runCatchingWarn(
    () => getPendingHuman(taskId),
    null,
    `fetchPendingHuman: network error for task ${taskId}`,
  );
}

export interface PendingShellPayload {
  commands: string[];
  needs_allowlist: string[];
  already_allowed: string[];
}

export async function fetchPendingShellCommands(
  taskId: string,
): Promise<PendingShellPayload> {
  const empty: PendingShellPayload = {
    commands: [],
    needs_allowlist: [],
    already_allowed: [],
  };
  return runCatchingWarn(
    async () => {
      const data = await getPendingShell(taskId);
      if (!data) return empty;
      return {
        commands: data.commands ?? [],
        needs_allowlist: data.needs_allowlist ?? [],
        already_allowed: data.already_allowed ?? [],
      };
    },
    empty,
    `fetchPendingShellCommands: network error for task ${taskId}`,
  );
}

export async function fetchFailedStep(taskId: string): Promise<string> {
  return runCatchingWarn(
    async () => {
      const data = await getTaskPipelinePlan(taskId);
      const explicit =
        typeof data.failed_step === "string" ? data.failed_step.trim() : "";
      if (explicit && explicit !== "graph") return explicit;
      const current =
        typeof data.current_step === "string" ? data.current_step.trim() : "";
      return current;
    },
    "",
    `fetchFailedStep: network error for task ${taskId}`,
  );
}

export async function fetchCurrentPipelineSteps(taskId: string): Promise<string[]> {
  return runCatchingWarn(
    async () => {
      const data = await getTaskPipelinePlan(taskId);
      return Array.isArray(data.pipeline_steps) ? data.pipeline_steps : [];
    },
    [],
    `fetchCurrentPipelineSteps: network error for task ${taskId}`,
  );
}

export async function submitContinuePipeline(
  taskId: string,
  additionalSteps: string[],
  settings: AgentConfigSettings,
  sendWsSubscribe: () => void,
): Promise<GateActionResult> {
  if (!taskId) return fail(noTaskIdMessage());
  if (!additionalSteps.length) return fail("Select at least one step to add");
  const agentConfig = buildAgentConfig(settings);
  if (!agentConfig) return SILENT;

  const currentSteps = await fetchCurrentPipelineSteps(taskId);
  const mergedSteps = [...currentSteps];
  for (const step of additionalSteps) {
    if (!mergedSteps.includes(step)) mergedSteps.push(step);
  }

  const body: Record<string, unknown> = {
    stream: true,
    agent_config: agentConfig,
    from_step: additionalSteps[0],
    pipeline_steps: mergedSteps,
  };

  const response = await postRetryStream(taskId, body);
  if (!response.ok) return fail("continue-pipeline HTTP " + response.status);
  sendWsSubscribe();
  await drainStream(response.body);
  return ok(undefined);
}

export async function submitRetry(
  taskId: string,
  fromBeginning: boolean,
  settings: AgentConfigSettings,
  sendWsSubscribe: () => void,
): Promise<GateActionResult> {
  if (!taskId) return fail(noTaskIdMessage());
  const agentConfig = buildAgentConfig(settings);
  if (!agentConfig) return SILENT;

  const body: Record<string, unknown> = { stream: true, agent_config: agentConfig };
  if (fromBeginning) {
    await runCatchingWarn(
      async () => {
        const pipelineSnapshot = await getTaskPipelinePlan(taskId);
        const steps = pipelineSnapshot.pipeline_steps;
        if (steps && steps.length) body.from_step = steps[0];
      },
      undefined,
      `submitRetry: could not read pipeline.json for task ${taskId}`,
    );
  }

  const response = await postRetryStream(taskId, body);
  if (!response.ok) return fail("retry HTTP " + response.status);
  sendWsSubscribe();
  await drainStream(response.body);
  return ok(undefined);
}
