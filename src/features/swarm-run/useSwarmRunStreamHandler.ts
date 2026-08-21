import type { ChatStreamEvent } from "@/shared/lib/chat-stream-events";

import { recordWorkspaceIndexStats } from "./workspaceIndexStats";

type NotifyLevel = "info" | "warning" | "error";

export interface SwarmStreamHandlerDeps {
  notify: (message: string, level: NotifyLevel, durationMs: number) => void;
  markTaskFailed: (detail: string) => void;
  autoApprovedMessage: (step: string, rule: string | null | undefined) => string;
  applyOrchestratorEvent: (
    event: Extract<ChatStreamEvent, { kind: "orchestrator" }>,
  ) => void;
  recordRetrievalDone: (
    event: Extract<ChatStreamEvent, { kind: "retrieval_done" }>["event"],
  ) => void;
}

function handleMcpStatus(
  event: Extract<ChatStreamEvent, { kind: "mcp_status" }>,
  deps: SwarmStreamHandlerDeps,
): void {
  const step = event.step || "step";
  const code = event.code ? ` [${event.code}]` : "";
  deps.notify(
    `MCP ${step}${code}: ${event.reason || event.message}`,
    event.explicitFallback ? "info" : "warning",
    4500,
  );
}

function handlePreflight(
  event: Extract<ChatStreamEvent, { kind: "preflight" }>,
  deps: SwarmStreamHandlerDeps,
): void {
  if (event.status !== "failed" && event.status !== "warning") return;
  const code = event.code ? ` [${event.code}]` : "";
  const detail = event.message || event.status;
  deps.notify(
    `${event.phase} preflight ${event.status}${code}: ${detail}`,
    event.status === "failed" ? "error" : "warning",
    6000,
  );
  if (event.status === "failed") deps.markTaskFailed(detail);
}

function handleScenario(
  event: Extract<ChatStreamEvent, { kind: "scenario" }>,
  deps: SwarmStreamHandlerDeps,
): void {
  if (!event.warnings.length) return;
  deps.notify(`${event.title}: ${event.warnings.join("; ")}`, "warning", 5000);
}

export function createSwarmStreamEventHandler(
  deps: SwarmStreamHandlerDeps,
): (event: ChatStreamEvent) => void {
  return (event: ChatStreamEvent): void => {
    switch (event.kind) {
      case "auto_approved":
        deps.notify(
          deps.autoApprovedMessage(event.step || "step", event.rule),
          "info",
          3500,
        );
        return;
      case "mcp_status":
        handleMcpStatus(event, deps);
        return;
      case "orchestrator":
        deps.applyOrchestratorEvent(event);
        return;
      case "preflight":
        handlePreflight(event, deps);
        return;
      case "scenario":
        handleScenario(event, deps);
        return;
      case "workspace_index_stats":
        recordWorkspaceIndexStats(event.stats);
        return;
      case "retrieval_done":
        deps.recordRetrievalDone(event.event);
        return;
    }
  };
}
