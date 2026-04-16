import { apiUrl } from "@/shared/api/base";
import type { useSettings } from "@/features/project-settings/useSettings";
import { buildAgentConfig } from "@/features/chat/useChat";
import { useI18n } from "@/shared/lib/i18n";
import { useUxStore } from "@/shared/store/ux";

type SettingsRef = ReturnType<typeof useSettings>;

function notifyError(message: string): void {
  useUxStore().notify(message, "error", 4200);
}

function noTaskIdMessage(): string {
  return useI18n().t("history.noTaskId");
}

/** Drain a streaming response body to completion. */
async function drainStream(
  body: ReadableStream<Uint8Array> | null | undefined,
): Promise<void> {
  const reader = body?.getReader();
  if (!reader) return;
  while (true) {
    const { done } = await reader.read();
    if (done) break;
  }
}

export async function submitHumanResume(
  taskId: string,
  feedback: string,
  sendWsSubscribe: () => void,
): Promise<void> {
  if (!taskId) {
    notifyError(noTaskIdMessage());
    return;
  }
  const resp = await fetch(
    apiUrl("/v1/tasks/" + encodeURIComponent(taskId) + "/human-resume"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback, stream: true }),
    },
  );
  if (!resp.ok) {
    notifyError("human-resume HTTP " + resp.status);
    return;
  }
  sendWsSubscribe();
  await drainStream(resp.body);
}

export async function confirmShell(taskId: string, approved: boolean): Promise<void> {
  if (!taskId) return;
  const resp = await fetch(
    apiUrl("/v1/tasks/" + encodeURIComponent(taskId) + "/confirm-shell"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    },
  );
  if (!resp.ok) notifyError("confirm-shell HTTP " + resp.status);
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
    const resp = await fetch(
      apiUrl("/v1/tasks/" + encodeURIComponent(taskId) + "/pending-manual-shell"),
    );
    if (!resp.ok) {
      if (resp.status !== 404) {
        console.warn(
          `fetchPendingManualShell: unexpected HTTP ${resp.status} for task ${taskId}`,
        );
      }
      return empty;
    }
    const data = (await resp.json()) as Partial<PendingManualShellPayload>;
    return { commands: data.commands ?? [], reason: data.reason ?? "" };
  } catch (error) {
    console.warn(`fetchPendingManualShell: network error for task ${taskId}:`, error);
    return empty;
  }
}

export async function confirmManualShell(taskId: string, done: boolean): Promise<void> {
  if (!taskId) return;
  const resp = await fetch(
    apiUrl("/v1/tasks/" + encodeURIComponent(taskId) + "/confirm-manual-shell"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    },
  );
  if (!resp.ok) notifyError("confirm-manual-shell HTTP " + resp.status);
}

export async function confirmHuman(
  taskId: string,
  approved: boolean,
  userInput = "",
): Promise<void> {
  if (!taskId) return;
  const resp = await fetch(
    apiUrl("/v1/tasks/" + encodeURIComponent(taskId) + "/confirm-human"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved, user_input: userInput }),
    },
  );
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    notifyError("confirm-human HTTP " + resp.status + ": " + (body.detail ?? ""));
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
    const resp = await fetch(
      apiUrl("/v1/tasks/" + encodeURIComponent(taskId) + "/pending-human"),
    );
    if (!resp.ok) {
      // 404 is expected when the task is not at a human gate; other codes are unexpected.
      if (resp.status !== 404) {
        console.warn(
          `fetchPendingHuman: unexpected HTTP ${resp.status} for task ${taskId}`,
        );
      }
      return null;
    }
    return (await resp.json()) as PendingHumanResponse;
  } catch (error) {
    console.warn(`fetchPendingHuman: network error for task ${taskId}:`, error);
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
    const resp = await fetch(
      apiUrl("/v1/tasks/" + encodeURIComponent(taskId) + "/pending-shell"),
    );
    if (!resp.ok) {
      if (resp.status !== 404) {
        console.warn(
          `fetchPendingShellCommands: unexpected HTTP ${resp.status} for task ${taskId}`,
        );
      }
      return empty;
    }
    const data = (await resp.json()) as Partial<PendingShellPayload>;
    return {
      commands: data.commands ?? [],
      needs_allowlist: data.needs_allowlist ?? [],
      already_allowed: data.already_allowed ?? [],
    };
  } catch (error) {
    console.warn(`fetchPendingShellCommands: network error for task ${taskId}:`, error);
    return empty;
  }
}

export async function fetchFailedStep(taskId: string): Promise<string> {
  try {
    const resp = await fetch(
      apiUrl("/artifacts/" + encodeURIComponent(taskId) + "/pipeline.json"),
    );
    if (!resp.ok) {
      console.warn(`fetchFailedStep: HTTP ${resp.status} for task ${taskId}`);
      return "";
    }
    const data = (await resp.json()) as { failed_step?: string };
    return data.failed_step ?? "";
  } catch (error) {
    console.warn(`fetchFailedStep: network error for task ${taskId}:`, error);
    return "";
  }
}

export const ALL_PIPELINE_STEPS = [
  "dev_lead",
  "dev",
  "review_dev",
  "qa",
  "review_qa",
] as const;

export type PipelineStep = (typeof ALL_PIPELINE_STEPS)[number];

export async function fetchCurrentPipelineSteps(taskId: string): Promise<string[]> {
  try {
    const resp = await fetch(
      apiUrl("/artifacts/" + encodeURIComponent(taskId) + "/pipeline.json"),
    );
    if (!resp.ok) {
      console.warn(`fetchCurrentPipelineSteps: HTTP ${resp.status} for task ${taskId}`);
      return [];
    }
    const data = (await resp.json()) as { pipeline_steps?: string[] };
    return data.pipeline_steps ?? [];
  } catch (error) {
    console.warn(`fetchCurrentPipelineSteps: network error for task ${taskId}:`, error);
    return [];
  }
}

export async function submitContinuePipeline(
  taskId: string,
  additionalSteps: string[],
  settings: SettingsRef,
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

  const resp = await fetch(
    apiUrl("/v1/tasks/" + encodeURIComponent(taskId) + "/retry"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!resp.ok) {
    notifyError("continue-pipeline HTTP " + resp.status);
    return;
  }
  sendWsSubscribe();
  await drainStream(resp.body);
}

export async function submitRetry(
  taskId: string,
  fromBeginning: boolean,
  settings: SettingsRef,
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
      const pipelineSnapshot = (await fetch(
        apiUrl("/artifacts/" + encodeURIComponent(taskId) + "/pipeline.json"),
      ).then((resp) => resp.json())) as { pipeline_steps?: string[] };
      const steps = pipelineSnapshot.pipeline_steps;
      if (steps && steps.length) body.from_step = steps[0];
    } catch (error) {
      console.warn(
        `submitRetry: could not read pipeline.json for task ${taskId}:`,
        error,
      );
    }
  }

  const resp = await fetch(
    apiUrl("/v1/tasks/" + encodeURIComponent(taskId) + "/retry"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!resp.ok) {
    notifyError("retry HTTP " + resp.status);
    return;
  }
  sendWsSubscribe();
  await drainStream(resp.body);
}
