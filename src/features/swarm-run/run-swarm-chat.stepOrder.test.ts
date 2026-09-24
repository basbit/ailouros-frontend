import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { runSwarmChat } from "./run-swarm-chat";
import { agentConfigErrorMessage } from "@/entities/agent-config";
import type { RunSwarmChatSettings } from "@/entities/agent-config";
import { useUxStore } from "@/shared/store/ux";
import { analyzePipelineStepOrder } from "@/entities/pipeline";

const startStreamMock = vi.fn();

vi.mock("@/shared/api/endpoints/onboarding", () => ({
  startSwarmChatStream: (body: unknown) => startStreamMock(body),
}));
vi.mock("@/shared/api/endpoints/scenarios", () => ({
  listScenarios: vi.fn(),
}));
vi.mock("@/entities/agent-config", () => ({
  buildAgentConfig: () => ({}),
  agentConfigErrorMessage: { value: null },
}));
vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("@/shared/lib/swarm-chat-stream", () => ({
  consumeSseStream: vi.fn(),
}));
vi.mock("@/entities/pipeline", () => ({
  analyzePipelineStepOrder: vi.fn(),
  formatStepOrderSummary: () => "qa runs before dev",
  roleRefForStep: () => null,
}));

function settings(): RunSwarmChatSettings {
  return {
    form: {
      prompt: "do it",
      workspace_root: "/ws",
      project_context_file: "",
      workspace_write: false,
      scenario_id: "",
      scenario_overrides: {},
    },
    pipelineState: {
      collectStepIds: () => ["qa", "dev"],
      collectStages: () => [],
    },
    rolesState: {
      collectRoleApiConfig: () => ({ model: "gemma", environment: "cloud" }),
    },
  } as unknown as RunSwarmChatSettings;
}

function handlers() {
  return {
    onTaskId: vi.fn(),
    onDone: vi.fn(),
    sendWsSubscribe: vi.fn(),
  };
}

function okResponse() {
  return {
    ok: true,
    headers: { get: () => "task-1" },
    body: { getReader: () => null },
  } as unknown as Response;
}

describe("runSwarmChat — broken step order confirmation", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    agentConfigErrorMessage.value = null;
    startStreamMock.mockResolvedValue(okResponse());
    vi.mocked(analyzePipelineStepOrder).mockReturnValue({
      hasViolations: true,
    } as ReturnType<typeof analyzePipelineStepOrder>);
  });

  it("asks through the app dialog, never the native browser confirm", async () => {
    const nativeConfirm = vi.spyOn(window, "confirm");
    const ux = useUxStore();
    const confirmSpy = vi.spyOn(ux, "confirmDialog").mockResolvedValue(true);

    await runSwarmChat(settings(), handlers());

    expect(nativeConfirm).not.toHaveBeenCalled();
    expect(confirmSpy).toHaveBeenCalledWith({
      title: "pipelineSteps.orderWarningTitle",
      message: "qa runs before dev\n\npipelineSteps.orderWarningPrompt",
    });
    nativeConfirm.mockRestore();
  });

  it("starts the run when the dialog is confirmed", async () => {
    const ux = useUxStore();
    vi.spyOn(ux, "confirmDialog").mockResolvedValue(true);

    await runSwarmChat(settings(), handlers());

    expect(startStreamMock).toHaveBeenCalledTimes(1);
    expect(agentConfigErrorMessage.value).toBeNull();
  });

  it("cancels the run and reports why when the dialog is dismissed", async () => {
    const ux = useUxStore();
    vi.spyOn(ux, "confirmDialog").mockResolvedValue(false);
    const runHandlers = handlers();

    await runSwarmChat(settings(), runHandlers);

    expect(startStreamMock).not.toHaveBeenCalled();
    expect(runHandlers.onTaskId).not.toHaveBeenCalled();
    expect(agentConfigErrorMessage.value).toBe(
      "pipelineSteps.orderWarningCancelled",
    );
  });

  it("does not open a dialog when the step order is sound", async () => {
    vi.mocked(analyzePipelineStepOrder).mockReturnValue({
      hasViolations: false,
    } as ReturnType<typeof analyzePipelineStepOrder>);
    const ux = useUxStore();
    const confirmSpy = vi.spyOn(ux, "confirmDialog");

    await runSwarmChat(settings(), handlers());

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(startStreamMock).toHaveBeenCalledTimes(1);
  });
});
