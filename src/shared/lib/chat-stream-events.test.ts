import { describe, expect, it } from "vitest";
import { parseChatStreamEvent } from "@/shared/lib/chat-stream-events";

describe("parseChatStreamEvent — empty/invalid", () => {
  it("returns null for empty string", () => {
    expect(parseChatStreamEvent("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(parseChatStreamEvent("   \n\t  ")).toBeNull();
  });

  it("returns null for plain log lines without JSON", () => {
    expect(parseChatStreamEvent("plain log line")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseChatStreamEvent("{bad json")).toBeNull();
  });

  it("returns null for JSON that doesn't match any known shape", () => {
    expect(parseChatStreamEvent('{"random":"object"}')).toBeNull();
  });

  it("returns null for non-object root JSON", () => {
    expect(parseChatStreamEvent("42")).toBeNull();
  });
});

describe("parseChatStreamEvent — orchestrator (prefixed line)", () => {
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

  it("returns null when prefix line lacks JSON after the colon", () => {
    expect(parseChatStreamEvent("[orchestrator-event]: not-json")).toBeNull();
  });

  it("returns null when prefix line has malformed JSON", () => {
    expect(parseChatStreamEvent("[orchestrator-event]: {oops")).toBeNull();
  });

  it("returns null when prefix line is missing the colon separator", () => {
    expect(
      parseChatStreamEvent('[orchestrator-event] {"event":"step_started"}'),
    ).toBeNull();
  });

  it("returns null when prefixed orchestrator event name is unknown", () => {
    expect(
      parseChatStreamEvent('[orchestrator-event]: {"event":"unknown_event"}'),
    ).toBeNull();
  });

  it("defaults status to 'progress' when omitted", () => {
    const parsed = parseChatStreamEvent(
      '[orchestrator-event]: {"event":"step_started"}',
    );
    expect(parsed?.kind).toBe("orchestrator");
    if (parsed?.kind === "orchestrator") {
      expect(parsed.status).toBe("progress");
    }
  });

  it("sets step=null when not a string", () => {
    const parsed = parseChatStreamEvent(
      '[orchestrator-event]: {"event":"step_started","step":42}',
    );
    if (parsed?.kind === "orchestrator") {
      expect(parsed.step).toBeNull();
    }
  });

  it("sets code=null when not a string", () => {
    const parsed = parseChatStreamEvent(
      '[orchestrator-event]: {"event":"step_started","code":99}',
    );
    if (parsed?.kind === "orchestrator") {
      expect(parsed.code).toBeNull();
    }
  });

  it("coerces message and timestamp to strings", () => {
    const parsed = parseChatStreamEvent(
      '[orchestrator-event]: {"event":"step_started","message":7,"timestamp":42}',
    );
    if (parsed?.kind === "orchestrator") {
      expect(parsed.message).toBe("7");
      expect(parsed.timestamp).toBe("42");
    }
  });
});

describe("parseChatStreamEvent — orchestrator (agent JSON)", () => {
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

  it("ignores agent=orchestrator JSON with unknown event name", () => {
    expect(
      parseChatStreamEvent(
        JSON.stringify({ agent: "orchestrator", event: "unknown_event" }),
      ),
    ).toBeNull();
  });

  it.each([
    "run_started",
    "step_started",
    "step_completed",
    "step_retry_started",
    "verification_layer_started",
    "verification_layer_completed",
    "pipeline_blocked",
    "final_gate_denied",
    "run_finished",
  ])("accepts orchestrator event '%s'", (eventName) => {
    const parsed = parseChatStreamEvent(
      JSON.stringify({ agent: "orchestrator", event: eventName }),
    );
    expect(parsed?.kind).toBe("orchestrator");
  });
});

describe("parseChatStreamEvent — mcp_status", () => {
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

  it("accepts _event_type as alternative discriminator", () => {
    const parsed = parseChatStreamEvent(
      JSON.stringify({
        _event_type: "mcp_status",
        step: "qa",
        message: "via alt key",
      }),
    );
    expect(parsed?.kind).toBe("mcp_status");
  });

  it("defaults nullable fields to null/empty when missing", () => {
    const parsed = parseChatStreamEvent(JSON.stringify({ status: "mcp_status" }));
    if (parsed?.kind === "mcp_status") {
      expect(parsed.step).toBeNull();
      expect(parsed.code).toBeNull();
      expect(parsed.reason).toBeNull();
      expect(parsed.action).toBeNull();
      expect(parsed.explicitFallback).toBe(false);
      expect(parsed.message).toBe("");
      expect(parsed.timestamp).toBe("");
    }
  });

  it("coerces explicit_fallback to boolean", () => {
    const truthy = parseChatStreamEvent(
      JSON.stringify({ status: "mcp_status", explicit_fallback: 1 }),
    );
    const falsy = parseChatStreamEvent(
      JSON.stringify({ status: "mcp_status", explicit_fallback: 0 }),
    );
    if (truthy?.kind === "mcp_status") expect(truthy.explicitFallback).toBe(true);
    if (falsy?.kind === "mcp_status") expect(falsy.explicitFallback).toBe(false);
  });

  it("sets step=null when value is not a string", () => {
    const parsed = parseChatStreamEvent(
      JSON.stringify({ status: "mcp_status", step: 42 }),
    );
    if (parsed?.kind === "mcp_status") expect(parsed.step).toBeNull();
  });
});

describe("parseChatStreamEvent — auto_approved", () => {
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

  it("preserves rule=null and audit=null when omitted", () => {
    const parsed = parseChatStreamEvent(
      JSON.stringify({ status: "auto_approved", step: "x" }),
    );
    if (parsed?.kind === "auto_approved") {
      expect(parsed.rule).toBeNull();
      expect(parsed.audit).toBeNull();
    }
  });

  it("coerces step to empty string when missing", () => {
    const parsed = parseChatStreamEvent(JSON.stringify({ status: "auto_approved" }));
    if (parsed?.kind === "auto_approved") {
      expect(parsed.step).toBe("");
    }
  });

  it("treats _event_type alternative discriminator", () => {
    const parsed = parseChatStreamEvent(
      JSON.stringify({ _event_type: "auto_approved", step: "x" }),
    );
    expect(parsed?.kind).toBe("auto_approved");
  });
});

describe("parseChatStreamEvent — fallthrough cases", () => {
  it("returns null when JSON has neither status nor _event_type marker", () => {
    expect(parseChatStreamEvent(JSON.stringify({ random: 1 }))).toBeNull();
  });

  it("returns null for unknown status discriminator", () => {
    expect(
      parseChatStreamEvent(JSON.stringify({ status: "unknown_kind", step: "x" })),
    ).toBeNull();
  });

  it("returns null when leading non-bracket-non-brace content", () => {
    expect(parseChatStreamEvent('"just a string"')).toBeNull();
  });
});
