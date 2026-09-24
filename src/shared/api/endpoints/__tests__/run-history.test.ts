import { afterEach, describe, expect, it, vi } from "vitest";
import { listServerRuns } from "@/shared/api/endpoints/run-history";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const SERVER_RUN = {
  task_id: "abc-123",
  created_at: "2026-09-16T10:00:00+00:00",
  updated_at: "2026-09-16T10:04:00+00:00",
  prompt: "make the tiles readable",
  prompt_truncated: true,
  scenario_id: "fix_bug",
  scenario_title: "Fix a bug",
  status: "completed",
  pipeline_steps: ["dev", "qa"],
  workspace_root: "/tmp/project-a",
  has_pipeline_snapshot: true,
};

function captureRequestUrls(): string[] {
  const requested: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: unknown) => {
      requested.push(String(input));
      return jsonResponse({ runs: [], returned: 0, total: 0, unreadable: 0 });
    }),
  );
  return requested;
}

function queryOf(url: string): URLSearchParams {
  return new URLSearchParams(url.slice(url.indexOf("?") + 1));
}

describe("listServerRuns", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps the backend payload onto camelCase rows", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ runs: [SERVER_RUN], returned: 1, total: 7, unreadable: 2 }),
      ),
    );

    const listing = await listServerRuns();

    expect(listing.total).toBe(7);
    expect(listing.unreadable).toBe(2);
    expect(listing.runs).toEqual([
      {
        taskId: "abc-123",
        createdAt: "2026-09-16T10:00:00+00:00",
        updatedAt: "2026-09-16T10:04:00+00:00",
        prompt: "make the tiles readable",
        promptTruncated: true,
        scenarioId: "fix_bug",
        scenarioTitle: "Fix a bug",
        status: "completed",
        pipelineSteps: ["dev", "qa"],
        workspaceRoot: "/tmp/project-a",
        hasPipelineSnapshot: true,
      },
    ]);
  });

  it("sends the limit and the workspace filter as query parameters", async () => {
    const requested = captureRequestUrls();

    await listServerRuns({ limit: 25, workspaceRoot: "/tmp/project a" });

    const query = queryOf(requested[0]);
    expect(requested[0]).toContain("/v1/runs?");
    expect(query.get("limit")).toBe("25");
    expect(query.get("workspace_root")).toBe("/tmp/project a");
  });

  it("omits an empty workspace filter rather than sending a blank one", async () => {
    const requested = captureRequestUrls();

    await listServerRuns({ workspaceRoot: "   " });

    expect(queryOf(requested[0]).has("workspace_root")).toBe(false);
  });

  it("rejects a payload that is not a run listing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ detail: "nope" })));

    await expect(listServerRuns()).rejects.toThrow(/malformed payload/);
  });

  it("rejects a row that carries no task id instead of dropping it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          runs: [{ ...SERVER_RUN, task_id: "" }],
          returned: 1,
          total: 1,
          unreadable: 0,
        }),
      ),
    );

    await expect(listServerRuns()).rejects.toThrow(/without a task id/);
  });
});
