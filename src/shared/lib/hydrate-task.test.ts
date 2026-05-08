import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { hydrateTaskFromServer } from "@/shared/lib/hydrate-task";
import * as tasksApi from "@/shared/api/endpoints/tasks";

describe("hydrateTaskFromServer scenario fields", () => {
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

  it("returns nulls when snapshot has no scenario fields", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "xyz",
      status: "completed",
      history: [],
      agents: [],
    });

    const out = await hydrateTaskFromServer("xyz");

    expect(out).not.toBeNull();
    expect(out!.scenarioId).toBeNull();
    expect(out!.scenarioTitle).toBeNull();
    expect(out!.scenarioCategory).toBeNull();
  });

  it("log fallback path returns null scenario fields", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockRejectedValue(
      new Error("not found"),
    );
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "log line",
    });
    vi.stubGlobal("fetch", fetchMock);

    const out = await hydrateTaskFromServer("logonly");

    expect(out).not.toBeNull();
    expect(out!.scenarioId).toBeNull();
    expect(out!.scenarioTitle).toBeNull();
    expect(out!.scenarioCategory).toBeNull();
    expect(out!.fromLogFallback).toBe(true);

    vi.unstubAllGlobals();
  });
});
