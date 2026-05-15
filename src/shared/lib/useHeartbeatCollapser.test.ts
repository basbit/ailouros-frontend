import { describe, expect, it } from "vitest";

import { useHeartbeatCollapser } from "./useHeartbeatCollapser";

describe("useHeartbeatCollapser", () => {
  it("returns non-heartbeat events unchanged", () => {
    const collapser = useHeartbeatCollapser();
    const event = { agent: "pm", status: "completed", message: "done" };
    expect(collapser.consume(event)).toBe(event);
    expect(collapser.activeHeartbeats.size).toBe(0);
  });

  it("collapses repeated heartbeats into one active row", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({ agent: "pm", status: "heartbeat", elapsed_sec: 30 });
    collapser.consume({ agent: "pm", status: "heartbeat", elapsed_sec: 60 });
    collapser.consume({ agent: "pm", status: "heartbeat", elapsed_sec: 120 });
    expect(collapser.activeHeartbeats.size).toBe(1);
    const row = collapser.activeHeartbeats.get("pm");
    expect(row?.elapsedSec).toBe(120);
  });

  it("returns null for heartbeat events to suppress them from timeline", () => {
    const collapser = useHeartbeatCollapser();
    const result = collapser.consume({
      agent: "pm",
      status: "heartbeat",
      elapsed_sec: 30,
    });
    expect(result).toBeNull();
  });

  it("freezes heartbeat when a real event arrives for that agent", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({ agent: "pm", status: "heartbeat", elapsed_sec: 30 });
    expect(collapser.activeHeartbeats.size).toBe(1);
    collapser.consume({ agent: "pm", status: "completed", message: "done" });
    expect(collapser.activeHeartbeats.size).toBe(0);
  });

  it("tracks heartbeats per agent independently", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({ agent: "pm", status: "heartbeat", elapsed_sec: 10 });
    collapser.consume({ agent: "ba", status: "heartbeat", elapsed_sec: 5 });
    expect(collapser.activeHeartbeats.size).toBe(2);
    collapser.consume({ agent: "pm", status: "completed" });
    expect(collapser.activeHeartbeats.size).toBe(1);
    expect(collapser.activeHeartbeats.get("ba")).toBeDefined();
  });

  it("reset() clears all active rows", () => {
    const collapser = useHeartbeatCollapser();
    collapser.consume({ agent: "pm", status: "heartbeat", elapsed_sec: 30 });
    collapser.consume({ agent: "ba", status: "heartbeat", elapsed_sec: 30 });
    collapser.reset();
    expect(collapser.activeHeartbeats.size).toBe(0);
  });

  it("ignores events without an agent", () => {
    const collapser = useHeartbeatCollapser();
    const event = { status: "heartbeat", elapsed_sec: 10 };
    expect(collapser.consume(event)).toBe(event);
  });
});
