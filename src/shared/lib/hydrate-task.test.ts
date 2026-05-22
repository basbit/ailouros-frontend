import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { hydrateTaskFromServer } from "@/shared/lib/hydrate-task";
import * as tasksApi from "@/shared/api/endpoints/tasks";

describe("hydrateTaskFromServer input validation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null for empty taskId", async () => {
    expect(await hydrateTaskFromServer("")).toBeNull();
  });

  it("returns null for whitespace-only taskId", async () => {
    expect(await hydrateTaskFromServer("   ")).toBeNull();
  });

  it("trims taskId before issuing request", async () => {
    const spy = vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "abc",
      status: "completed",
      history: [],
      agents: [],
    });
    await hydrateTaskFromServer("   abc   ");
    expect(spy).toHaveBeenCalledWith("abc");
  });
});

describe("hydrateTaskFromServer snapshot path", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("propagates scenario_id, title, category from snapshot", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "abc",
      status: "completed",
      history: [],
      agents: [],
      scenario_id: "code_review",
      scenario_title: "Code Review",
      scenario_category: "code_quality",
    });

    const out = await hydrateTaskFromServer("abc");

    expect(out).not.toBeNull();
    expect(out!.scenarioId).toBe("code_review");
    expect(out!.scenarioTitle).toBe("Code Review");
    expect(out!.scenarioCategory).toBe("code_quality");
  });

  it("returns null scenario fields when snapshot has none", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "xyz",
      status: "completed",
      history: [],
      agents: [],
    });

    const out = await hydrateTaskFromServer("xyz");

    expect(out!.scenarioId).toBeNull();
    expect(out!.scenarioTitle).toBeNull();
    expect(out!.scenarioCategory).toBeNull();
  });

  it("preserves history and agents arrays verbatim", async () => {
    const history = [
      { agent: "researcher", message: "found x", timestamp: "2026-04-01T10:00:00Z" },
      { agent: "coder", message: "wrote y", timestamp: "2026-04-01T10:05:00Z" },
    ];
    const agents = ["researcher", "coder"];
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "with-history",
      status: "completed",
      history,
      agents,
    });

    const out = await hydrateTaskFromServer("with-history");

    expect(out!.history).toEqual(history);
    expect(out!.agents).toEqual(agents);
    expect(out!.fromLogFallback).toBe(false);
  });

  it("defaults history and agents to [] when snapshot omits them", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "minimal",
      status: "pending",
    });

    const out = await hydrateTaskFromServer("minimal");

    expect(out!.history).toEqual([]);
    expect(out!.agents).toEqual([]);
  });

  it("propagates error field verbatim and exposes status as string", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "failed",
      status: "failed",
      history: [],
      agents: [],
      error: "boom",
    });

    const out = await hydrateTaskFromServer("failed");

    expect(out!.error).toBe("boom");
    expect(out!.status).toBe("failed");
  });

  it("falls back to null status when snapshot.status is not a string", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "weird",
      status: 42 as unknown as string,
      history: [],
      agents: [],
    });

    const out = await hydrateTaskFromServer("weird");
    expect(out!.status).toBeNull();
  });

  it("falls back to null error when snapshot omits error", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "ok",
      status: "completed",
      history: [],
      agents: [],
    });

    const out = await hydrateTaskFromServer("ok");
    expect(out!.error).toBeNull();
  });

  it("builds artifactPath with URL-encoded taskId", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "task id with spaces/slash",
      status: "completed",
      history: [],
      agents: [],
    });
    const out = await hydrateTaskFromServer("task id with spaces/slash");
    expect(out!.artifactPath).toContain("task%20id%20with%20spaces%2Fslash");
  });
});

describe("hydrateTaskFromServer log fallback path", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns null scenario fields and fromLogFallback=true with status 'completed'", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockRejectedValue(
      new Error("not found"),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, text: async () => "log line" }),
    );

    const out = await hydrateTaskFromServer("logonly");

    expect(out!.fromLogFallback).toBe(true);
    expect(out!.status).toBe("completed");
    expect(out!.error).toBeNull();
    expect(out!.agents).toEqual([]);
    expect(out!.scenarioId).toBeNull();
    expect(out!.scenarioTitle).toBeNull();
    expect(out!.scenarioCategory).toBeNull();
  });

  it("inserts trimmed log body as single history entry under pipeline_run.log agent", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockRejectedValue(new Error("x"));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "  multi-line\nlog body  ",
      }),
    );

    const out = await hydrateTaskFromServer("withlog");

    expect(out!.history).toHaveLength(1);
    expect(out!.history[0].agent).toBe("pipeline_run.log");
    expect(out!.history[0].message).toBe("multi-line\nlog body");
    expect(typeof out!.history[0].timestamp).toBe("string");
  });

  it("substitutes placeholder when pipeline_run.log content is empty", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockRejectedValue(new Error("x"));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, text: async () => "   " }),
    );

    const out = await hydrateTaskFromServer("emptylog");

    expect(out!.history[0].message).toBe("(empty pipeline_run.log)");
  });

  it("returns null when both snapshot and log fallback fail", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockRejectedValue(
      new Error("snapshot down"),
    );
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("log unavailable")));

    const out = await hydrateTaskFromServer("nothing");
    expect(out).toBeNull();
  });
});
