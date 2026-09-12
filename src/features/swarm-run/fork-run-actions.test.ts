import { beforeEach, describe, expect, it, vi } from "vitest";

const forkTaskStep = vi.fn();
const postForkRunStream = vi.fn();

vi.mock("@/shared/api/endpoints/task-fork", () => ({
  forkTaskStep: (...args: unknown[]) => forkTaskStep(...args),
  postForkRunStream: (...args: unknown[]) => postForkRunStream(...args),
}));

vi.mock("@/entities/agent-config", () => ({
  buildAgentConfig: () => ({ pm: { model: "m" } }),
}));

import { submitForkAndRun } from "@/features/swarm-run/fork-run-actions";

const settings = {} as never;

function okStream(): Response {
  return { ok: true, status: 200, body: null } as unknown as Response;
}

describe("submitForkAndRun", () => {
  beforeEach(() => {
    forkTaskStep.mockReset();
    postForkRunStream.mockReset();
  });

  it("branches at the step and then re-runs the branch", async () => {
    forkTaskStep.mockResolvedValueOnce({
      forked_task_id: "fork-1",
      parent_task_id: "parent-1",
      step_id: "dev",
      snapshot_keys: ["dev_output"],
      message: "ok",
    });
    postForkRunStream.mockResolvedValueOnce(okStream());
    const seen: string[] = [];

    const result = await submitForkAndRun(
      {
        parentTaskId: "parent-1",
        stepId: "dev",
        pipelineSteps: ["pm", "dev", "qa"],
        settings,
        instruction: "use a different algorithm",
      },
      (id) => seen.push(id),
    );

    expect(forkTaskStep).toHaveBeenCalledWith("parent-1", { step_id: "dev" });
    expect(postForkRunStream).toHaveBeenCalledWith("fork-1", {
      agentConfig: { pm: { model: "m" } },
      pipelineSteps: ["pm", "dev", "qa"],
      instruction: "use a different algorithm",
    });
    expect(seen).toEqual(["fork-1"]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.forkedTaskId).toBe("fork-1");
  });

  it("does not start a run when the branch could not be created", async () => {
    forkTaskStep.mockRejectedValueOnce(new Error("no checkpoint for that step"));
    const seen: string[] = [];

    const result = await submitForkAndRun(
      { parentTaskId: "parent-1", stepId: "dev", pipelineSteps: [], settings },
      (id) => seen.push(id),
    );

    expect(postForkRunStream).not.toHaveBeenCalled();
    expect(seen).toEqual([]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("no checkpoint");
  });

  it("reports an HTTP failure of the re-run instead of claiming success", async () => {
    forkTaskStep.mockResolvedValueOnce({
      forked_task_id: "fork-2",
      parent_task_id: "parent-1",
      step_id: "dev",
      snapshot_keys: [],
      message: "ok",
    });
    postForkRunStream.mockResolvedValueOnce({
      ok: false,
      status: 503,
      body: null,
    } as unknown as Response);

    const result = await submitForkAndRun(
      { parentTaskId: "parent-1", stepId: "dev", pipelineSteps: [], settings },
      () => {},
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("503");
  });
});
