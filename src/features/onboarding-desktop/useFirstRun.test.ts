import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const bridge = vi.hoisted(() => ({
  isDesktop: vi.fn<() => boolean>(),
  probeDesktop: vi.fn<() => Promise<boolean>>(),
  invokeCommand:
    vi.fn<(command: string, args?: Record<string, unknown>) => Promise<unknown>>(),
  listenEvent:
    vi.fn<(name: string, handler: (payload: unknown) => void) => Promise<() => void>>(),
  DESKTOP_EVENTS: { bootstrapProgress: "bootstrap://progress" },
}));

vi.mock("@/shared/lib/desktop-bridge", () => bridge);

afterEach(() => {
  vi.clearAllMocks();
});

describe("useFirstRun — browser fallback", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(false);
    bridge.probeDesktop.mockResolvedValue(false);
  });

  it("stays invisible and never invokes IPC", async () => {
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    expect(flow.visible.value).toBe(false);
    expect(bridge.invokeCommand).not.toHaveBeenCalled();
  });
});

describe("useFirstRun — desktop", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(true);
    bridge.probeDesktop.mockResolvedValue(true);
    bridge.listenEvent.mockResolvedValue(() => {});
  });

  it("seeds done stages from bootstrap status and stays visible while pending", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "get_bootstrap_status") {
        return {
          stages: [
            { stage: "fetching-python", done: true },
            { stage: "staging-mcp-runtimes", done: true },
            { stage: "creating-venv", done: false },
            { stage: "staging-llama-cpp", done: false },
            { stage: "downloading-model", done: false },
          ],
          default_model_present: false,
          default_model_skipped: false,
          first_run_complete: false,
          all_required_done: false,
        };
      }
      throw new Error(`unexpected ${command}`);
    });

    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();

    const python = flow.stages.value.find((entry) => entry.stage === "fetching-python");
    const venv = flow.stages.value.find((entry) => entry.stage === "creating-venv");
    expect(python?.state).toBe("done");
    expect(venv?.state).toBe("pending");
    expect(flow.visible.value).toBe(true);
  });

  it("becomes invisible once status reports all required done", async () => {
    bridge.invokeCommand.mockImplementation(async () => ({
      stages: [
        { stage: "fetching-python", done: true },
        { stage: "staging-mcp-runtimes", done: true },
        { stage: "creating-venv", done: true },
        { stage: "staging-llama-cpp", done: true },
        { stage: "downloading-model", done: true },
      ],
      default_model_present: true,
      default_model_skipped: false,
      first_run_complete: true,
      all_required_done: true,
    }));

    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    expect(flow.ready.value).toBe(true);
    expect(flow.visible.value).toBe(false);
  });

  it("skipModel flips the model stage to skipped and persists via IPC", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "get_bootstrap_status") {
        return {
          stages: [{ stage: "downloading-model", done: false }],
          default_model_present: false,
          default_model_skipped: false,
          first_run_complete: false,
          all_required_done: false,
        };
      }
      if (command === "skip_default_model") return undefined;
      throw new Error(`unexpected ${command}`);
    });

    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    await flow.skipModel();
    const model = flow.stages.value.find(
      (entry) => entry.stage === "downloading-model",
    );
    expect(model?.state).toBe("skipped");
    expect(bridge.invokeCommand).toHaveBeenCalledWith("skip_default_model");
  });

  it("keeps the dialog visible when the model was skipped but is still missing", async () => {
    bridge.invokeCommand.mockImplementation(async () => ({
      stages: [
        { stage: "fetching-python", done: true },
        { stage: "staging-mcp-runtimes", done: true },
        { stage: "creating-venv", done: true },
        { stage: "staging-llama-cpp", done: true },
        { stage: "downloading-model", done: true },
      ],
      default_model_present: false,
      default_model_skipped: true,
      first_run_complete: true,
      all_required_done: true,
    }));

    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    expect(flow.ready.value).toBe(false);
    expect(flow.visible.value).toBe(true);
    const model = flow.stages.value.find(
      (entry) => entry.stage === "downloading-model",
    );
    expect(model?.state).toBe("skipped");
  });

  it("retryModelDownload clears skip, marks the stage active, and invokes IPC", async () => {
    let skipped = true;
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "get_bootstrap_status") {
        return {
          stages: [{ stage: "downloading-model", done: false }],
          default_model_present: false,
          default_model_skipped: skipped,
          first_run_complete: false,
          all_required_done: false,
        };
      }
      if (command === "retry_default_model_download") {
        skipped = false;
        return undefined;
      }
      throw new Error(`unexpected ${command}`);
    });

    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    await flow.retryModelDownload();

    expect(bridge.invokeCommand).toHaveBeenCalledWith("retry_default_model_download");
    const model = flow.stages.value.find(
      (entry) => entry.stage === "downloading-model",
    );
    expect(model?.state).toBe("active");
  });

  it("dismiss marks first-run complete via IPC and hides the modal", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "get_bootstrap_status") {
        return {
          stages: [],
          default_model_present: false,
          default_model_skipped: false,
          first_run_complete: false,
          all_required_done: false,
        };
      }
      if (command === "mark_first_run_complete") return undefined;
      throw new Error(`unexpected ${command}`);
    });
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    await flow.dismiss();
    expect(flow.dismissed.value).toBe(true);
    expect(flow.visible.value).toBe(false);
    expect(bridge.invokeCommand).toHaveBeenCalledWith("mark_first_run_complete");
  });
});
