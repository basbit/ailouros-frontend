import { describe, expect, it } from "vitest";

import { useHeartbeatCollapser } from "./useHeartbeatCollapser";

describe("useHeartbeatCollapser — non-heartbeat passthrough", () => {
  it("returns non-heartbeat events unchanged", () => {
    const collapser = useHeartbeatCollapser();
    const event = { agent: "pm", status: "completed", message: "done" };
    expect(collapser.consume(event)).toBe(event);
    expect(collapser.activeHeartbeats.size).toBe(0);
  });

  it("ignores events without an agent and returns them as-is", () => {
    const collapser = useHeartbeatCollapser();
    const event = { status: "heartbeat", elapsed_sec: 10 };
    expect(collapser.consume(event)).toBe(event);
    expect(collapser.activeHeartbeats.size).toBe(0);
  });

  it("ignores events with whitespace-only agent name", () => {
    const collapser = useHeartbeatCollapser();
    const event = { agent: "   ", status: "heartbeat", elapsed_sec: 10 };
    expect(collapser.consume(event)).toBe(event);
    expect(collapser.activeHeartbeats.size).toBe(0);
  });

  it("trims agent name before storing", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({ agent: "  pm  ", status: "heartbeat", elapsed_sec: 1 });
    expect(collapser.activeHeartbeats.size).toBe(1);
    expect(collapser.activeHeartbeats.get("pm")).toBeDefined();
  });
});

describe("useHeartbeatCollapser — heartbeat insertion", () => {
  it("returns null for heartbeat events to suppress them from timeline", () => {
    const collapser = useHeartbeatCollapser();
    const result = collapser.consume({
      agent: "pm",
      status: "heartbeat",
      elapsed_sec: 30,
    });
    expect(result).toBeNull();
  });

  it("creates a row with default message when message is omitted", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({ agent: "pm", status: "heartbeat", elapsed_sec: 30 });
    const row = collapser.activeHeartbeats.get("pm");
    expect(row?.message).toBe("pm: still working");
    expect(row?.elapsedSec).toBe(30);
    expect(row?.nextCheckInSec).toBeNull();
    expect(typeof row?.startedAtMs).toBe("number");
  });

  it("uses provided message verbatim on first heartbeat", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({
      agent: "ba",
      status: "heartbeat",
      message: "thinking hard",
      elapsed_sec: 5,
      next_check_in_sec: 30,
    });
    const row = collapser.activeHeartbeats.get("ba");
    expect(row?.message).toBe("thinking hard");
    expect(row?.elapsedSec).toBe(5);
    expect(row?.nextCheckInSec).toBe(30);
  });

  it("tracks heartbeats per agent independently", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({ agent: "pm", status: "heartbeat", elapsed_sec: 10 });
    collapser.consume({ agent: "ba", status: "heartbeat", elapsed_sec: 5 });
    expect(collapser.activeHeartbeats.size).toBe(2);
  });
});

describe("useHeartbeatCollapser — heartbeat update", () => {
  it("collapses repeated heartbeats into one active row", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({ agent: "pm", status: "heartbeat", elapsed_sec: 30 });
    collapser.consume({ agent: "pm", status: "heartbeat", elapsed_sec: 60 });
    collapser.consume({ agent: "pm", status: "heartbeat", elapsed_sec: 120 });
    expect(collapser.activeHeartbeats.size).toBe(1);
    expect(collapser.activeHeartbeats.get("pm")?.elapsedSec).toBe(120);
  });

  it("updates message when the new heartbeat includes one", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({ agent: "pm", status: "heartbeat", message: "phase 1" });
    collapser.consume({ agent: "pm", status: "heartbeat", message: "phase 2" });
    expect(collapser.activeHeartbeats.get("pm")?.message).toBe("phase 2");
  });

  it("retains previous message when new heartbeat omits message", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({ agent: "pm", status: "heartbeat", message: "stored" });
    collapser.consume({ agent: "pm", status: "heartbeat" });
    expect(collapser.activeHeartbeats.get("pm")?.message).toBe("stored");
  });

  it("retains elapsed/nextCheckIn when new heartbeat omits them", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({
      agent: "pm",
      status: "heartbeat",
      elapsed_sec: 30,
      next_check_in_sec: 60,
    });
    collapser.consume({ agent: "pm", status: "heartbeat" });
    const row = collapser.activeHeartbeats.get("pm");
    expect(row?.elapsedSec).toBe(30);
    expect(row?.nextCheckInSec).toBe(60);
  });

  it("preserves startedAtMs across multiple heartbeat updates", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({ agent: "pm", status: "heartbeat", elapsed_sec: 10 });
    const start = collapser.activeHeartbeats.get("pm")?.startedAtMs;
    collapser.consume({ agent: "pm", status: "heartbeat", elapsed_sec: 20 });
    expect(collapser.activeHeartbeats.get("pm")?.startedAtMs).toBe(start);
  });
});

describe("useHeartbeatCollapser — terminal events", () => {
  it("removes heartbeat when a real event arrives for that agent", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({ agent: "pm", status: "heartbeat", elapsed_sec: 30 });
    expect(collapser.activeHeartbeats.size).toBe(1);
    collapser.consume({ agent: "pm", status: "completed", message: "done" });
    expect(collapser.activeHeartbeats.size).toBe(0);
  });

  it("returns the terminal event unchanged when clearing a tracked heartbeat", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({ agent: "pm", status: "heartbeat" });
    const terminal = { agent: "pm", status: "failed", message: "boom" };
    expect(collapser.consume(terminal)).toBe(terminal);
  });

  it("returns the event unchanged when agent had no active heartbeat", () => {
    const collapser = useHeartbeatCollapser();
    const event = { agent: "fresh", status: "completed" };
    expect(collapser.consume(event)).toBe(event);
    expect(collapser.activeHeartbeats.size).toBe(0);
  });

  it("clears only the relevant agent on terminal event", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({ agent: "pm", status: "heartbeat", elapsed_sec: 10 });
    collapser.consume({ agent: "ba", status: "heartbeat", elapsed_sec: 5 });
    collapser.consume({ agent: "pm", status: "completed" });
    expect(collapser.activeHeartbeats.size).toBe(1);
    expect(collapser.activeHeartbeats.has("pm")).toBe(false);
    expect(collapser.activeHeartbeats.has("ba")).toBe(true);
  });
});

describe("useHeartbeatCollapser.reset", () => {
  it("clears all active rows", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({ agent: "pm", status: "heartbeat", elapsed_sec: 30 });
    collapser.consume({ agent: "ba", status: "heartbeat", elapsed_sec: 30 });
    collapser.reset();
    expect(collapser.activeHeartbeats.size).toBe(0);
  });

  it("is a no-op on empty state", () => {
    const collapser = useHeartbeatCollapser();
    collapser.reset();
    expect(collapser.activeHeartbeats.size).toBe(0);
  });
});
