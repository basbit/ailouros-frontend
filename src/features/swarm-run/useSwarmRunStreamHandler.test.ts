import { describe, it, expect, vi } from "vitest";
import {
  createSwarmStreamEventHandler,
  type SwarmStreamHandlerDeps,
} from "./useSwarmRunStreamHandler";

function makeDeps() {
  const notify = vi.fn();
  const markTaskFailed = vi.fn();
  const applyOrchestratorEvent = vi.fn();
  const recordRetrievalDone = vi.fn();
  const deps: SwarmStreamHandlerDeps = {
    notify,
    markTaskFailed,
    autoApprovedMessage: (step, rule) => `approved ${step}${rule ? ` (${rule})` : ""}`,
    applyOrchestratorEvent,
    recordRetrievalDone,
  };
  return { deps, notify, markTaskFailed, applyOrchestratorEvent, recordRetrievalDone };
}

describe("createSwarmStreamEventHandler", () => {
  it("surfaces a failed preflight (401) as an error toast and marks the task failed", () => {
    const { deps, notify, markTaskFailed } = makeDeps();
    createSwarmStreamEventHandler(deps)({
      kind: "preflight",
      phase: "mcp",
      status: "failed",
      message: "Error code: 401 - Unauthorized",
      code: null,
    });
    expect(notify).toHaveBeenCalledWith(
      "mcp preflight failed: Error code: 401 - Unauthorized",
      "error",
      6000,
    );
    expect(markTaskFailed).toHaveBeenCalledWith("Error code: 401 - Unauthorized");
  });

  it("surfaces a preflight warning without marking the task failed", () => {
    const { deps, notify, markTaskFailed } = makeDeps();
    createSwarmStreamEventHandler(deps)({
      kind: "preflight",
      phase: "model",
      status: "warning",
      message: "weak model",
      code: null,
    });
    expect(notify).toHaveBeenCalledWith(
      "model preflight warning: weak model",
      "warning",
      6000,
    );
    expect(markTaskFailed).not.toHaveBeenCalled();
  });

  it("ignores a passed preflight", () => {
    const { deps, notify, markTaskFailed } = makeDeps();
    createSwarmStreamEventHandler(deps)({
      kind: "preflight",
      phase: "session",
      status: "passed",
      message: "",
      code: null,
    });
    expect(notify).not.toHaveBeenCalled();
    expect(markTaskFailed).not.toHaveBeenCalled();
  });

  it("notifies scenario warnings", () => {
    const { deps, notify } = makeDeps();
    createSwarmStreamEventHandler(deps)({
      kind: "scenario",
      id: "build",
      title: "Build",
      category: "build",
      warnings: ["no workspace"],
    });
    expect(notify).toHaveBeenCalledWith("Build: no workspace", "warning", 5000);
  });

  it("routes orchestrator and retrieval_done events to their handlers", () => {
    const { deps, applyOrchestratorEvent, recordRetrievalDone } = makeDeps();
    const handle = createSwarmStreamEventHandler(deps);
    handle({
      kind: "orchestrator",
      event: "run_started",
      status: "progress",
      step: null,
      message: "",
      timestamp: "",
      code: null,
      reason: null,
    });
    expect(applyOrchestratorEvent).toHaveBeenCalledOnce();
    const retrievalEvent = { namespace: "wiki", query: "q", elapsedMs: 1, chunks: [] };
    handle({ kind: "retrieval_done", event: retrievalEvent });
    expect(recordRetrievalDone).toHaveBeenCalledWith(retrievalEvent);
  });

  it("ignores workspace_index_stats without throwing", () => {
    const { deps, notify } = makeDeps();
    expect(() =>
      createSwarmStreamEventHandler(deps)({
        kind: "workspace_index_stats",
        stats: { files: 1 },
      }),
    ).not.toThrow();
    expect(notify).not.toHaveBeenCalled();
  });
});
