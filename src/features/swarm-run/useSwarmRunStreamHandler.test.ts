import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSwarmStreamEventHandler,
  type SwarmStreamHandlerDeps,
} from "./useSwarmRunStreamHandler";
import { resetWorkspaceIndexStats, workspaceIndexLatest } from "./workspaceIndexStats";

function makeDeps() {
  const notify = vi.fn();
  const markTaskFailed = vi.fn();
  const applyOrchestratorEvent = vi.fn();
  const recordRetrievalDone = vi.fn();
  const onAwaitingClarification = vi.fn();
  const deps: SwarmStreamHandlerDeps = {
    notify,
    markTaskFailed,
    autoApprovedMessage: (step, rule) => `approved ${step}${rule ? ` (${rule})` : ""}`,
    applyOrchestratorEvent,
    recordRetrievalDone,
    onAwaitingClarification,
  };
  return {
    deps,
    notify,
    markTaskFailed,
    applyOrchestratorEvent,
    recordRetrievalDone,
    onAwaitingClarification,
  };
}

describe("createSwarmStreamEventHandler", () => {
  beforeEach(() => {
    resetWorkspaceIndexStats();
  });

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

  it("records workspace_index_stats into the shared store", () => {
    const { deps } = makeDeps();
    createSwarmStreamEventHandler(deps)({
      kind: "workspace_index_stats",
      stats: { total_files: 42, omitted_files: 3 },
    });
    expect(workspaceIndexLatest.value?.total_files).toBe(42);
    expect(workspaceIndexLatest.value?.omitted_files).toBe(3);
  });

  it("surfaces the gate on an awaiting_human orchestrator status line", () => {
    const { deps, onAwaitingClarification } = makeDeps();
    createSwarmStreamEventHandler(deps)({
      kind: "orchestrator_status_line",
      status: "awaiting_human",
      detail: "Waiting for manual approval of step pm",
    });
    expect(onAwaitingClarification).toHaveBeenCalledOnce();
  });

  it("ignores non-gate orchestrator status lines", () => {
    const { deps, notify, markTaskFailed } = makeDeps();
    createSwarmStreamEventHandler(deps)({
      kind: "orchestrator_status_line",
      status: "cancelled",
      detail: "stopped by user",
    });
    expect(notify).not.toHaveBeenCalled();
    expect(markTaskFailed).not.toHaveBeenCalled();
  });
});
