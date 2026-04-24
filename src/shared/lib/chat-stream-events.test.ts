import { describe, expect, it } from "vitest";
import { parseChatStreamEvent } from "@/shared/lib/chat-stream-events";

describe("chat-stream event normalization", () => {
  it("parses prefixed orchestrator JSON lines", () => {
    expect(
      parseChatStreamEvent(
        '[orchestrator-event]: {"event":"step_started","status":"in_progress","step":"pm","message":"Planning","timestamp":"2026-04-21T00:00:00Z","code":"STEP_STARTED"}',
      ),
    ).toEqual({
      kind: "orchestrator",
      event: "step_started",
      status: "in_progress",
      step: "pm",
      message: "Planning",
      timestamp: "2026-04-21T00:00:00Z",
      code: "STEP_STARTED",
      reason: null,
    });
  });

  it("parses direct orchestrator payloads emitted as JSON", () => {
    expect(
      parseChatStreamEvent(
        JSON.stringify({
          agent: "orchestrator",
          event: "pipeline_blocked",
          status: "blocked",
          step: "review_pm",
          message: "needs human review",
          timestamp: "2026-04-21T00:01:00Z",
          reason: "retry budget exhausted",
        }),
      ),
    ).toEqual({
      kind: "orchestrator",
      event: "pipeline_blocked",
      status: "blocked",
      step: "review_pm",
      message: "needs human review",
      timestamp: "2026-04-21T00:01:00Z",
      code: null,
      reason: "retry budget exhausted",
    });
  });

  it("parses structured MCP status payloads", () => {
    expect(
      parseChatStreamEvent(
        JSON.stringify({
          status: "mcp_status",
          step: "qa",
          code: "TOOL_TIMEOUT",
          reason: "tool exceeded budget",
          action: "retry_later",
          explicit_fallback: true,
          message: "MCP tool timed out",
          timestamp: "2026-04-21T00:02:00Z",
        }),
      ),
    ).toEqual({
      kind: "mcp_status",
      step: "qa",
      code: "TOOL_TIMEOUT",
      reason: "tool exceeded budget",
      action: "retry_later",
      explicitFallback: true,
      message: "MCP tool timed out",
      timestamp: "2026-04-21T00:02:00Z",
    });
  });

  it("parses auto-approved audit payloads", () => {
    expect(
      parseChatStreamEvent(
        JSON.stringify({
          status: "auto_approved",
          step: "human_dev",
          rule: "low-risk-edit",
          audit: { hash: "abc123" },
        }),
      ),
    ).toEqual({
      kind: "auto_approved",
      step: "human_dev",
      rule: "low-risk-edit",
      audit: { hash: "abc123" },
    });
  });

  it("drops invalid or non-structured payloads", () => {
    expect(parseChatStreamEvent("plain log line")).toBeNull();
    expect(parseChatStreamEvent("{bad json")).toBeNull();
    expect(parseChatStreamEvent('{"event":"unknown"}')).toBeNull();
  });
});
