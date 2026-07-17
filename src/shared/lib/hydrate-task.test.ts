import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveTaskFromServer } from "@/shared/lib/hydrate-task";
import { ApiError } from "@/shared/api/http";
import * as tasksApi from "@/shared/api/endpoints/tasks";

describe("resolveTaskFromServer input validation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("treats an empty taskId as an unknown task", async () => {
    expect(await resolveTaskFromServer("")).toEqual({ outcome: "unknown" });
  });

  it("treats a whitespace-only taskId as an unknown task", async () => {
    expect(await resolveTaskFromServer("   ")).toEqual({ outcome: "unknown" });
  });

  it("trims taskId before issuing request", async () => {
    const spy = vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "abc",
      status: "completed",
      history: [],
      agents: [],
    });
    await resolveTaskFromServer("   abc   ");
    expect(spy).toHaveBeenCalledWith("abc");
  });
});

describe("resolveTaskFromServer snapshot path", () => {
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

    const resolution = await resolveTaskFromServer("abc");

    expect(resolution.outcome).toBe("found");
    if (resolution.outcome !== "found") return;
    expect(resolution.task.scenarioId).toBe("code_review");
    expect(resolution.task.scenarioTitle).toBe("Code Review");
    expect(resolution.task.scenarioCategory).toBe("code_quality");
  });

  it("returns null scenario fields when snapshot has none", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "xyz",
      status: "completed",
      history: [],
      agents: [],
    });

    const resolution = await resolveTaskFromServer("xyz");

    if (resolution.outcome !== "found") throw new Error("expected found");
    expect(resolution.task.scenarioId).toBeNull();
    expect(resolution.task.scenarioTitle).toBeNull();
    expect(resolution.task.scenarioCategory).toBeNull();
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

    const resolution = await resolveTaskFromServer("with-history");

    if (resolution.outcome !== "found") throw new Error("expected found");
    expect(resolution.task.history).toEqual(history);
    expect(resolution.task.agents).toEqual(agents);
  });

  it("defaults history and agents to [] when snapshot omits them", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "minimal",
      status: "pending",
    });

    const resolution = await resolveTaskFromServer("minimal");

    if (resolution.outcome !== "found") throw new Error("expected found");
    expect(resolution.task.history).toEqual([]);
    expect(resolution.task.agents).toEqual([]);
  });

  it("propagates error field verbatim and exposes status as string", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "failed",
      status: "failed",
      history: [],
      agents: [],
      error: "boom",
    });

    const resolution = await resolveTaskFromServer("failed");

    if (resolution.outcome !== "found") throw new Error("expected found");
    expect(resolution.task.error).toBe("boom");
    expect(resolution.task.status).toBe("failed");
  });

  it("falls back to null status when snapshot.status is not a string", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "weird",
      status: 42 as unknown as string,
      history: [],
      agents: [],
    });

    const resolution = await resolveTaskFromServer("weird");

    if (resolution.outcome !== "found") throw new Error("expected found");
    expect(resolution.task.status).toBeNull();
  });

  it("falls back to null error when snapshot omits error", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "ok",
      status: "completed",
      history: [],
      agents: [],
    });

    const resolution = await resolveTaskFromServer("ok");

    if (resolution.outcome !== "found") throw new Error("expected found");
    expect(resolution.task.error).toBeNull();
  });

  it("builds artifactPath with URL-encoded taskId", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockResolvedValue({
      task_id: "task id with spaces/slash",
      status: "completed",
      history: [],
      agents: [],
    });

    const resolution = await resolveTaskFromServer("task id with spaces/slash");

    if (resolution.outcome !== "found") throw new Error("expected found");
    expect(resolution.task.artifactPath).toContain("task%20id%20with%20spaces%2Fslash");
  });
});

describe("resolveTaskFromServer failure path", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports a 404 as an unknown task", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockRejectedValue(
      new ApiError("HTTP 404", 404, "task not found"),
    );

    expect(await resolveTaskFromServer("gone")).toEqual({ outcome: "unknown" });
  });

  it("surfaces a transport failure instead of guessing a status", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockRejectedValue(
      new Error("Failed to fetch"),
    );

    expect(await resolveTaskFromServer("offline")).toEqual({
      outcome: "error",
      message: "Failed to fetch",
    });
  });

  it("surfaces a server error instead of reporting the task as unknown", async () => {
    vi.spyOn(tasksApi, "getLegacyTaskSnapshot").mockRejectedValue(
      new ApiError("HTTP 503", 503, "unavailable"),
    );

    expect(await resolveTaskFromServer("flaky")).toEqual({
      outcome: "error",
      message: "HTTP 503",
    });
  });
});
