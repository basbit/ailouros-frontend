import { beforeEach, describe, expect, it, vi } from "vitest";

import { runSwarmChat } from "./run-swarm-chat";
import type { RunSwarmChatSettings } from "@/shared/lib/agent-config";
import type { ScenarioSummary } from "@/shared/model/scenario-types";

const startStreamMock = vi.fn();
const listScenariosMock = vi.fn();

vi.mock("@/shared/api/endpoints/onboarding", () => ({
  startSwarmChatStream: (body: unknown) => startStreamMock(body),
}));
vi.mock("@/shared/api/endpoints/scenarios", () => ({
  listScenarios: () => listScenariosMock(),
}));
vi.mock("@/shared/lib/agent-config", () => ({
  buildAgentConfig: () => ({}),
  agentConfigErrorMessage: { value: null },
}));
vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("@/shared/lib/swarm-chat-stream", () => ({
  consumeSseStream: vi.fn(),
}));
vi.mock("@/shared/lib/step-order", () => ({
  analyzePipelineStepOrder: () => ({ hasViolations: false }),
  formatStepOrderSummary: () => "",
}));
vi.mock("@/shared/lib/pipeline-schema", () => ({
  // Only "needs-model" maps to a role; all other step ids resolve to no role
  // so existing tests skip the role-model preflight.
  roleRefForStep: (id: string) => (id === "needs-model" ? "dev" : null),
}));

function makeSettings(
  scenarioId: string,
  roleModel = "gemma",
  attachments?: { name: string; content: string }[],
): RunSwarmChatSettings {
  return {
    form: {
      prompt: "do it",
      workspace_root: "/ws",
      project_context_file: "",
      workspace_write: false,
      scenario_id: scenarioId,
      scenario_overrides: {},
      attachments,
    },
    pipelineState: {
      collectStepIds: () => [],
      collectStages: () => [],
    },
    rolesState: {
      collectRoleApiConfig: () => ({ model: roleModel, environment: "cloud" }),
    },
  } as unknown as RunSwarmChatSettings;
}

function makeScenario(overrides: Partial<ScenarioSummary> = {}): ScenarioSummary {
  return {
    id: "s1",
    title: "S1",
    category: "development",
    description: "",
    pipeline_steps: ["spec", "build"],
    default_gates: [],
    expected_artifacts: [],
    required_tools: [],
    recommended_models: {},
    workspace_write_default: false,
    tags: [],
    quality_checks: [],
    inputs: [],
    ...overrides,
  } as ScenarioSummary;
}

function okResponse() {
  return {
    ok: true,
    headers: { get: (h: string) => (h === "x-task-id" ? "task-1" : null) },
    body: null,
  };
}

describe("runSwarmChat scenario resolution", () => {
  beforeEach(() => {
    startStreamMock.mockReset();
    listScenariosMock.mockReset();
    startStreamMock.mockResolvedValue(okResponse());
  });

  it("resolves the scenario via the injected resolver, not the backend list", async () => {
    const scenario = makeScenario({ pipeline_steps: ["spec", "build"] });
    const resolveScenario = vi.fn().mockResolvedValue({ scenario, isCustom: false });
    const handlers = { onTaskId: vi.fn(), onDone: vi.fn(), sendWsSubscribe: vi.fn() };

    await runSwarmChat(makeSettings("s1"), handlers, { resolveScenario });

    expect(resolveScenario).toHaveBeenCalledWith("s1");
    expect(listScenariosMock).not.toHaveBeenCalled();
    expect(startStreamMock).toHaveBeenCalledTimes(1);
    const payload = startStreamMock.mock.calls[0][0] as {
      pipeline_steps: string[];
      scenario_id?: string;
    };
    expect(payload.pipeline_steps).toContain("build");
    expect(payload.scenario_id).toBe("s1");
  });

  it("reports the scenario's steps to onTaskId, not the pipeline editor's", async () => {
    // The history entry is built from onTaskId's steps. A selected scenario owns
    // the pipeline, so reporting the editor's steps would make the run view render
    // a step list the run never executes.
    const scenario = makeScenario({ pipeline_steps: ["spec", "build"] });
    const resolveScenario = vi.fn().mockResolvedValue({ scenario, isCustom: false });
    const handlers = { onTaskId: vi.fn(), onDone: vi.fn(), sendWsSubscribe: vi.fn() };
    const settings = makeSettings("s1");
    settings.pipelineState.collectStepIds = () => ["editor-only-step"];

    await runSwarmChat(settings, handlers, { resolveScenario });

    const payload = startStreamMock.mock.calls[0][0] as { pipeline_steps: string[] };
    expect(handlers.onTaskId).toHaveBeenCalledWith("task-1", payload.pipeline_steps);
    expect(handlers.onTaskId).not.toHaveBeenCalledWith("task-1", ["editor-only-step"]);
  });

  it("omits scenario_id for a custom scenario but keeps its steps", async () => {
    const scenario = makeScenario({
      id: "spec-copy-x",
      category: "custom",
      pipeline_steps: ["spec", "build"],
    });
    const resolveScenario = vi.fn().mockResolvedValue({ scenario, isCustom: true });
    const handlers = { onTaskId: vi.fn(), onDone: vi.fn(), sendWsSubscribe: vi.fn() };

    await runSwarmChat(makeSettings("spec-copy-x"), handlers, { resolveScenario });

    expect(startStreamMock).toHaveBeenCalledTimes(1);
    const payload = startStreamMock.mock.calls[0][0] as {
      pipeline_steps: string[];
      scenario_id?: string;
    };
    expect(payload.scenario_id).toBeUndefined();
    expect(payload.pipeline_steps).toContain("build");
  });

  it("aborts (no request) when a pipeline role has no model configured", async () => {
    const scenario = makeScenario({ id: "s-dev", pipeline_steps: ["needs-model"] });
    const resolveScenario = vi.fn().mockResolvedValue({ scenario, isCustom: false });
    const handlers = { onTaskId: vi.fn(), onDone: vi.fn(), sendWsSubscribe: vi.fn() };

    await runSwarmChat(makeSettings("s-dev", ""), handlers, { resolveScenario });

    expect(startStreamMock).not.toHaveBeenCalled();
  });

  it("proceeds when the pipeline role has a model", async () => {
    const scenario = makeScenario({ id: "s-dev2", pipeline_steps: ["needs-model"] });
    const resolveScenario = vi.fn().mockResolvedValue({ scenario, isCustom: false });
    const handlers = { onTaskId: vi.fn(), onDone: vi.fn(), sendWsSubscribe: vi.fn() };

    await runSwarmChat(makeSettings("s-dev2", "gemma"), handlers, { resolveScenario });

    expect(startStreamMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the backend list when no resolver is injected", async () => {
    listScenariosMock.mockResolvedValue({ scenarios: [makeScenario()] });
    const handlers = { onTaskId: vi.fn(), onDone: vi.fn(), sendWsSubscribe: vi.fn() };

    await runSwarmChat(makeSettings("s1"), handlers);

    expect(listScenariosMock).toHaveBeenCalledTimes(1);
    expect(startStreamMock).toHaveBeenCalledTimes(1);
  });

  it("registers the failed run from X-Task-Id when the request errors", async () => {
    // Early (pre-stream) failures still carry a recoverable task_id; the run
    // must be registered so it stays visible in history with its logs.
    startStreamMock.mockResolvedValue({
      ok: false,
      status: 500,
      headers: {
        get: (h: string) =>
          h === "x-task-id"
            ? "failed-task-9"
            : h === "content-type"
              ? "text/plain"
              : null,
      },
    });
    const scenario = makeScenario();
    const resolveScenario = vi.fn().mockResolvedValue({ scenario, isCustom: false });
    const handlers = { onTaskId: vi.fn(), onDone: vi.fn(), sendWsSubscribe: vi.fn() };

    await expect(
      runSwarmChat(makeSettings("s1"), handlers, { resolveScenario }),
    ).rejects.toThrow();

    expect(handlers.onTaskId).toHaveBeenCalledWith(
      "failed-task-9",
      expect.arrayContaining(["spec", "build"]),
    );
    expect(handlers.onDone).not.toHaveBeenCalled();
  });

  it("embeds filtered attachments into the launch payload", async () => {
    const scenario = makeScenario();
    const resolveScenario = vi.fn().mockResolvedValue({ scenario, isCustom: false });
    const handlers = { onTaskId: vi.fn(), onDone: vi.fn(), sendWsSubscribe: vi.fn() };

    await runSwarmChat(
      makeSettings("s1", "gemma", [
        { name: "spec.md", content: "## spec" },
        { name: "  ", content: "bad" }, // blank name → filtered out
        { name: "empty.txt", content: "" }, // empty content → filtered out
      ]),
      handlers,
      { resolveScenario },
    );

    expect(startStreamMock).toHaveBeenCalledTimes(1);
    const payload = startStreamMock.mock.calls[0][0] as {
      attachments: { name: string; content: string }[];
    };
    expect(payload.attachments).toEqual([{ name: "spec.md", content: "## spec" }]);
  });

  it("omits attachments when the form has none", async () => {
    const scenario = makeScenario();
    const resolveScenario = vi.fn().mockResolvedValue({ scenario, isCustom: false });
    const handlers = { onTaskId: vi.fn(), onDone: vi.fn(), sendWsSubscribe: vi.fn() };

    await runSwarmChat(makeSettings("s1"), handlers, { resolveScenario });

    const payload = startStreamMock.mock.calls[0][0] as { attachments?: unknown };
    expect(payload.attachments).toBeUndefined();
  });

  it("embeds filtered image attachments into the launch payload", async () => {
    const scenario = makeScenario();
    const resolveScenario = vi.fn().mockResolvedValue({ scenario, isCustom: false });
    const handlers = { onTaskId: vi.fn(), onDone: vi.fn(), sendWsSubscribe: vi.fn() };
    const settings = makeSettings("s1");
    settings.form.image_attachments = [
      { name: "shot.png", path: " /ws/assets/shot.png " },
      { name: "  ", path: "/ws/blank-name.png" }, // blank name → filtered out
      { name: "no-path.png", path: "" }, // blank path → filtered out
    ];

    await runSwarmChat(settings, handlers, { resolveScenario });

    const payload = startStreamMock.mock.calls[0][0] as {
      image_attachments?: { name: string; path: string }[];
    };
    expect(payload.image_attachments).toEqual([
      { name: "shot.png", path: "/ws/assets/shot.png" },
    ]);
  });

  it("warns when image attachments ride a pipeline without a pm step", async () => {
    // Only the pm node pre-processes images through vision tools (pm_vision);
    // a run without pm would silently ignore the screenshots otherwise.
    const scenario = makeScenario({ pipeline_steps: ["spec", "build"] });
    const resolveScenario = vi.fn().mockResolvedValue({ scenario, isCustom: false });
    const onWarning = vi.fn();
    const handlers = {
      onTaskId: vi.fn(),
      onDone: vi.fn(),
      sendWsSubscribe: vi.fn(),
      onWarning,
    };
    const settings = makeSettings("s1");
    settings.form.image_attachments = [
      { name: "shot.png", path: "/ws/assets/shot.png" },
    ];

    await runSwarmChat(settings, handlers, { resolveScenario });

    expect(onWarning).toHaveBeenCalledTimes(1);
    expect(String(onWarning.mock.calls[0][0])).toContain("no 'pm' step");
  });

  it("does not warn about image attachments when pm is in the pipeline", async () => {
    const scenario = makeScenario({ pipeline_steps: ["pm", "build"] });
    const resolveScenario = vi.fn().mockResolvedValue({ scenario, isCustom: false });
    const onWarning = vi.fn();
    const handlers = {
      onTaskId: vi.fn(),
      onDone: vi.fn(),
      sendWsSubscribe: vi.fn(),
      onWarning,
    };
    const settings = makeSettings("s1");
    settings.form.image_attachments = [
      { name: "shot.png", path: "/ws/assets/shot.png" },
    ];

    await runSwarmChat(settings, handlers, { resolveScenario });

    expect(onWarning).not.toHaveBeenCalled();
  });
});
