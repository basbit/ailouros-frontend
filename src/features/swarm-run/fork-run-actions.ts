import { ApiError } from "@/shared/api/http";
import { buildAgentConfig, type AgentConfigSettings } from "@/entities/agent-config";
import { forkTaskStep, postForkRunStream } from "@/shared/api/endpoints/task-fork";
import { drainStream, type GateActionResult } from "./task-gate-actions";

export interface ForkAndRunInput {
  parentTaskId: string;
  stepId: string;
  pipelineSteps: string[];
  settings: AgentConfigSettings;
  /** What to change on the branch; empty keeps the parent's goal verbatim. */
  instruction?: string | null;
}

export interface ForkAndRunData {
  forkedTaskId: string;
}

function describeForkError(error: unknown, prefix: string): string {
  if (error instanceof ApiError) {
    try {
      const parsed = JSON.parse(error.body ?? "") as { detail?: unknown };
      if (typeof parsed.detail === "string" && parsed.detail.trim()) return parsed.detail;
    } catch {
      /* the body is not the usual {detail: ...} envelope */
    }
    return `${prefix} HTTP ${error.status}${error.body ? ": " + error.body : ""}`;
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * Branch a finished or running task at `stepId` and immediately re-run the
 * branch from that step. The parent run is never touched.
 *
 * `onForked` fires as soon as the branch exists and before the re-run stream is
 * drained: the pipeline executes *inside* that response, so a caller that waits
 * for the drain would leave the operator staring at the parent run.
 */
export async function submitForkAndRun(
  input: ForkAndRunInput,
  onForked: (forkedTaskId: string) => void,
): Promise<GateActionResult<ForkAndRunData>> {
  const { parentTaskId, stepId, pipelineSteps, settings } = input;
  if (!parentTaskId || !stepId) {
    return { ok: false, error: "fork: no task id or step id" };
  }
  const agentConfig = buildAgentConfig(settings);
  // buildAgentConfig reports its own failure; an empty error means "stay quiet".
  if (!agentConfig) return { ok: false, error: "" };

  let forkedTaskId = "";
  try {
    const fork = await forkTaskStep(parentTaskId, { step_id: stepId });
    forkedTaskId = fork.forked_task_id;
  } catch (error) {
    return { ok: false, error: describeForkError(error, "fork-step") };
  }
  if (!forkedTaskId) {
    return { ok: false, error: "fork-step returned no forked task id" };
  }

  onForked(forkedTaskId);

  try {
    const response = await postForkRunStream(forkedTaskId, {
      agentConfig,
      pipelineSteps: pipelineSteps.length ? pipelineSteps : null,
      instruction: input.instruction?.trim() ? input.instruction.trim() : null,
    });
    if (!response.ok) {
      return { ok: false, error: `fork-run HTTP ${response.status}` };
    }
    await drainStream(response.body);
  } catch (error) {
    return { ok: false, error: describeForkError(error, "fork-run") };
  }
  return { ok: true, data: { forkedTaskId } };
}
