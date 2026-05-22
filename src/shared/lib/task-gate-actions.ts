import { ApiError } from "@/shared/api/client";
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
import { frontendLogger } from "@/shared/lib/frontend-logger";
import { useI18n } from "@/shared/lib/i18n";
import { useUxStore } from "@/shared/store/ux";

function notifyError(message: string): void {
  useUxStore().notify(message, "error", 4200);
}

function noTaskIdMessage(): string {
  return useI18n().t("history.noTaskId");
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
): Promise<void> {
  if (!taskId) {
    notifyError(noTaskIdMessage());
    return;
  }
  const response = await postHumanResumeStream(taskId, feedback);
  if (!response.ok) {
    notifyError("human-resume HTTP " + response.status);
    return;
  }
  sendWsSubscribe();
  await drainStream(response.body, onEvent);
}

export async function confirmShell(taskId: string, approved: boolean): Promise<void> {
  if (!taskId) return;
  try {
    await postConfirmShell(taskId, approved);
  } catch (error) {
    notifyError(
      error instanceof ApiError ? "confirm-shell HTTP " + error.status : String(error),
    );
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
  try {
    const data = await getPendingManualShell(taskId);
    if (!data) return empty;
    return { commands: data.commands ?? [], reason: data.reason ?? "" };
  } catch (error) {
    frontendLogger.warn(
      `fetchPendingManualShell: network error for task ${taskId}`,
      error,
    );
    return empty;
  }
}

export async function confirmManualShell(taskId: string, done: boolean): Promise<void> {
  if (!taskId) return;
  try {
    await postConfirmManualShell(taskId, done);
  } catch (error) {
    notifyError(
      error instanceof ApiError
        ? "confirm-manual-shell HTTP " + error.status
        : String(error),
    );
  }
}

export async function confirmHuman(
  taskId: string,
  approved: boolean,
  userInput = "",
): Promise<void> {
  if (!taskId) return;
  try {
    await postConfirmHuman(taskId, approved, userInput);
  } catch (error) {
    if (error instanceof ApiError) {
      notifyError("confirm-human HTTP " + error.status + ": " + (error.body ?? ""));
      return;
    }
    notifyError(String(error));
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
  try {
    return await getPendingHuman(taskId);
  } catch (error) {
    frontendLogger.warn(`fetchPendingHuman: network error for task ${taskId}`, error);
    return null;
  }
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
  try {
    const data = await getPendingShell(taskId);
    if (!data) return empty;
    return {
      commands: data.commands ?? [],
      needs_allowlist: data.needs_allowlist ?? [],
      already_allowed: data.already_allowed ?? [],
    };
  } catch (error) {
    frontendLogger.warn(
      `fetchPendingShellCommands: network error for task ${taskId}`,
      error,
    );
    return empty;
  }
}

export async function fetchFailedStep(taskId: string): Promise<string> {
  try {
    const data = await getTaskPipelinePlan(taskId);
    const explicit =
      typeof data.failed_step === "string" ? data.failed_step.trim() : "";
    if (explicit && explicit !== "graph") return explicit;
    const current =
      typeof data.current_step === "string" ? data.current_step.trim() : "";
    return current;
  } catch (error) {
    frontendLogger.warn(`fetchFailedStep: network error for task ${taskId}`, error);
    return "";
  }
}

export async function fetchCurrentPipelineSteps(taskId: string): Promise<string[]> {
  try {
    const data = await getTaskPipelinePlan(taskId);
    return Array.isArray(data.pipeline_steps) ? data.pipeline_steps : [];
  } catch (error) {
    frontendLogger.warn(
      `fetchCurrentPipelineSteps: network error for task ${taskId}`,
      error,
    );
    return [];
  }
}

export async function submitContinuePipeline(
  taskId: string,
  additionalSteps: string[],
  settings: AgentConfigSettings,
  sendWsSubscribe: () => void,
): Promise<void> {
  if (!taskId) {
    notifyError(noTaskIdMessage());
    return;
  }
  if (!additionalSteps.length) {
    notifyError("Select at least one step to add");
    return;
  }
  const agentConfig = buildAgentConfig(settings);
  if (!agentConfig) return;

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
  if (!response.ok) {
    notifyError("continue-pipeline HTTP " + response.status);
    return;
  }
  sendWsSubscribe();
  await drainStream(response.body);
}

export async function submitRetry(
  taskId: string,
  fromBeginning: boolean,
  settings: AgentConfigSettings,
  sendWsSubscribe: () => void,
): Promise<void> {
  if (!taskId) {
    notifyError(noTaskIdMessage());
    return;
  }
  const agentConfig = buildAgentConfig(settings);
  if (!agentConfig) return;

  const body: Record<string, unknown> = { stream: true, agent_config: agentConfig };
  if (fromBeginning) {
    try {
      const pipelineSnapshot = await getTaskPipelinePlan(taskId);
      const steps = pipelineSnapshot.pipeline_steps;
      if (steps && steps.length) body.from_step = steps[0];
    } catch (error) {
      frontendLogger.warn(
        `submitRetry: could not read pipeline.json for task ${taskId}`,
        error,
      );
    }
  }

  const response = await postRetryStream(taskId, body);
  if (!response.ok) {
    notifyError("retry HTTP " + response.status);
    return;
  }
  sendWsSubscribe();
  await drainStream(response.body);
}
