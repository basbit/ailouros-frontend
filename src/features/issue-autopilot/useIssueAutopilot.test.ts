import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/http";

const fetchAutorunConfig = vi.fn();
const fetchAutorunEvents = vi.fn();
const createAutorunRule = vi.fn();
const updateAutorunRule = vi.fn();
const deleteAutorunRule = vi.fn();

vi.mock("@/shared/api/endpoints/issue-autopilot", () => ({
  fetchAutorunConfig: (...args: unknown[]) => fetchAutorunConfig(...args),
  fetchAutorunEvents: (...args: unknown[]) => fetchAutorunEvents(...args),
  createAutorunRule: (...args: unknown[]) => createAutorunRule(...args),
  updateAutorunRule: (...args: unknown[]) => updateAutorunRule(...args),
  deleteAutorunRule: (...args: unknown[]) => deleteAutorunRule(...args),
}));

import { AUTOPILOT_EVENT_LIMIT, useIssueAutopilot } from "./useIssueAutopilot";

const rule = {
  rule_id: "r1",
  source: "github" as const,
  repository_key: "acme/app",
  workspace_root: "/work/app",
  scenario_id: "fix_bug",
  label: "swarm",
  target_branch: "main",
  enabled: true,
  allow_command_exec: false,
};

const status = {
  github_secret_configured: true,
  linear_secret_configured: false,
  ready: true,
  not_ready_reason: "",
  github_webhook_path: "/v1/integrations/issues/webhook/github",
  linear_webhook_path: "/v1/integrations/issues/webhook/linear",
};

describe("useIssueAutopilot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAutorunConfig.mockResolvedValue({ rules: [rule], status });
    fetchAutorunEvents.mockResolvedValue([{ kind: "pull_request_opened", task_id: "t1" }]);
  });

  it("loads rules, readiness and the recent event log together", async () => {
    const autopilot = useIssueAutopilot();
    await autopilot.load();

    expect(autopilot.rules.value).toEqual([rule]);
    expect(autopilot.status.value?.github_secret_configured).toBe(true);
    expect(autopilot.events.value).toHaveLength(1);
    expect(fetchAutorunEvents).toHaveBeenCalledWith(AUTOPILOT_EVENT_LIMIT);
  });

  it("creates a new rule from the draft and updates an edited one", async () => {
    createAutorunRule.mockResolvedValue(rule);
    updateAutorunRule.mockResolvedValue(rule);
    const autopilot = useIssueAutopilot();

    autopilot.draft.value.repository_key = "acme/app";
    autopilot.draft.value.workspace_root = "/work/app";
    expect(await autopilot.save()).toBe(true);
    expect(createAutorunRule).toHaveBeenCalledWith(
      expect.objectContaining({ repository_key: "acme/app", label: "swarm", scenario_id: "fix_bug" }),
    );

    autopilot.edit(rule);
    autopilot.draft.value.label = "autopilot";
    await autopilot.save();
    expect(updateAutorunRule).toHaveBeenCalledWith("r1", expect.objectContaining({ label: "autopilot" }));
    expect(autopilot.editingRuleId.value).toBeNull();
  });

  it("shows the backend's refusal reason instead of a bare status code", async () => {
    createAutorunRule.mockRejectedValue(
      new ApiError(
        "HTTP 400",
        400,
        JSON.stringify({ detail: "autorun was not enabled: no server-side LLM provider is ready" }),
      ),
    );
    const autopilot = useIssueAutopilot();

    expect(await autopilot.save()).toBe(false);
    expect(autopilot.error.value).toContain("no server-side LLM provider is ready");
    expect(fetchAutorunConfig).not.toHaveBeenCalled();
  });

  it("deletes a rule and reloads", async () => {
    deleteAutorunRule.mockResolvedValue({});
    const autopilot = useIssueAutopilot();

    await autopilot.remove("r1");

    expect(deleteAutorunRule).toHaveBeenCalledWith("r1");
    expect(fetchAutorunConfig).toHaveBeenCalledTimes(1);
  });

  it("ignores a second delete while the first is still in flight, then allows the next", async () => {
    let finish: () => void = () => undefined;
    deleteAutorunRule.mockImplementationOnce(
      () => new Promise((resolve) => { finish = () => resolve({}); }),
    );
    const autopilot = useIssueAutopilot();

    const first = autopilot.remove("r1");
    await autopilot.remove("r1");
    expect(autopilot.removingRuleId.value).toBe("r1");
    finish();
    await first;

    expect(deleteAutorunRule).toHaveBeenCalledTimes(1);
    expect(autopilot.removingRuleId.value).toBeNull();
    deleteAutorunRule.mockResolvedValue({});
    await autopilot.remove("r1");
    expect(deleteAutorunRule).toHaveBeenCalledTimes(2);
  });
});
