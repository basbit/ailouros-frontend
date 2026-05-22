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

let capturedProgressHandler: ((payload: unknown) => void) | null = null;
let unlistenSpy: ReturnType<typeof vi.fn<() => void>>;

beforeEach(() => {
  capturedProgressHandler = null;
  unlistenSpy = vi.fn<() => void>();
  bridge.listenEvent.mockImplementation(async (_name, handler) => {
    capturedProgressHandler = handler;
    return unlistenSpy as () => void;
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

function statusStub(overrides: Record<string, unknown> = {}): unknown {
  return {
    stages: [],
    default_model_present: false,
    default_model_skipped: false,
    first_run_complete: false,
    all_required_done: false,
    ...overrides,
  };
}

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

  it("skipModel/retryModelDownload short-circuit when not desktop", async () => {
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.skipModel();
    await flow.retryModelDownload();
    expect(bridge.invokeCommand).not.toHaveBeenCalled();
  });

  it("dismiss marks dismissed even when not desktop and skips IPC", async () => {
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.dismiss();
    expect(flow.dismissed.value).toBe(true);
    expect(bridge.invokeCommand).not.toHaveBeenCalled();
  });
});

describe("useFirstRun — desktop bootstrap status", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(true);
    bridge.probeDesktop.mockResolvedValue(true);
  });

  it("seeds done stages from bootstrap status and stays visible while pending", async () => {
    bridge.invokeCommand.mockResolvedValue(
      statusStub({
        stages: [
          { stage: "fetching-python", done: true },
          { stage: "staging-mcp-runtimes", done: true },
          { stage: "creating-venv", done: false },
        ],
      }),
    );

    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();

    expect(
      flow.stages.value.find((entry) => entry.stage === "fetching-python")?.state,
    ).toBe("done");
    expect(
      flow.stages.value.find((entry) => entry.stage === "creating-venv")?.state,
    ).toBe("pending");
    expect(flow.visible.value).toBe(true);
  });

  it("becomes invisible once status reports all required done with model present", async () => {
    bridge.invokeCommand.mockResolvedValue(
      statusStub({
        stages: [{ stage: "downloading-model", done: true }],
        default_model_present: true,
        all_required_done: true,
      }),
    );

    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    expect(flow.ready.value).toBe(true);
    expect(flow.visible.value).toBe(false);
  });

  it("keeps modal visible when model was skipped but still missing", async () => {
    bridge.invokeCommand.mockResolvedValue(
      statusStub({
        stages: [{ stage: "downloading-model", done: true }],
        default_model_present: false,
        default_model_skipped: true,
        all_required_done: true,
      }),
    );
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    expect(flow.ready.value).toBe(false);
    expect(flow.visible.value).toBe(true);
    expect(
      flow.stages.value.find((entry) => entry.stage === "downloading-model")?.state,
    ).toBe("skipped");
  });

  it("ignores stages not in the visible set", async () => {
    bridge.invokeCommand.mockResolvedValue(
      statusStub({
        stages: [{ stage: "unknown-stage" as never, done: true }],
      }),
    );
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    expect(
      flow.stages.value.find((entry) => entry.stage === "fetching-python")?.state,
    ).toBe("pending");
  });

  it("does not promote stages reported as not done", async () => {
    bridge.invokeCommand.mockResolvedValue(
      statusStub({
        stages: [{ stage: "fetching-python", done: false }],
      }),
    );
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    expect(
      flow.stages.value.find((entry) => entry.stage === "fetching-python")?.state,
    ).toBe("pending");
  });

  it("surfaces error from loadStatus failure", async () => {
    bridge.invokeCommand.mockRejectedValueOnce(new Error("ipc broken"));
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ ollama: [], lm_studio: [], assignments: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    try {
      const { useFirstRun } = await import("./useFirstRun");
      const flow = useFirstRun();
      await flow.start();
      expect(flow.error.value).toBe("ipc broken");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("useFirstRun — applyProgress via event listener", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(true);
    bridge.probeDesktop.mockResolvedValue(true);
    bridge.invokeCommand.mockResolvedValue(statusStub());
  });

  it("marks active when fraction < 1", async () => {
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    capturedProgressHandler!({
      stage: "fetching-python",
      fraction: 0.4,
      message: "downloading",
    });
    const entry = flow.stages.value.find((s) => s.stage === "fetching-python");
    expect(entry?.state).toBe("active");
    expect(entry?.fraction).toBeCloseTo(0.4);
    expect(entry?.message).toBe("downloading");
  });

  it("marks done when fraction >= 1", async () => {
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    capturedProgressHandler!({
      stage: "creating-venv",
      fraction: 1,
      message: "complete",
    });
    expect(flow.stages.value.find((s) => s.stage === "creating-venv")?.state).toBe(
      "done",
    );
  });

  it("marks skipped when downloading-model message contains 'skipped'", async () => {
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    capturedProgressHandler!({
      stage: "downloading-model",
      fraction: 0,
      message: "Default model skipped by user",
    });
    expect(flow.stages.value.find((s) => s.stage === "downloading-model")?.state).toBe(
      "skipped",
    );
  });

  it("does not re-mutate stages already in done state", async () => {
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    capturedProgressHandler!({ stage: "fetching-python", fraction: 1, message: "" });
    capturedProgressHandler!({
      stage: "fetching-python",
      fraction: 0.2,
      message: "regressed",
    });
    const entry = flow.stages.value.find((s) => s.stage === "fetching-python");
    expect(entry?.state).toBe("done");
    expect(entry?.fraction).toBe(1);
  });

  it("ignores unknown stages", async () => {
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    capturedProgressHandler!({
      stage: "unknown" as never,
      fraction: 0.5,
      message: "x",
    });
    expect(flow.stages.value.find((s) => s.stage === "fetching-python")?.state).toBe(
      "pending",
    );
  });

  it("collapses to ready and finalises pending/active stages on stage='ready'", async () => {
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    capturedProgressHandler!({
      stage: "fetching-python",
      fraction: 0.5,
      message: "in-flight",
    });
    capturedProgressHandler!({ stage: "ready" as never, fraction: 1, message: "" });
    expect(flow.ready.value).toBe(true);
    for (const entry of flow.stages.value) {
      expect(entry.state === "done" || entry.state === "skipped").toBe(true);
    }
  });
});

describe("useFirstRun — skip / retry / dismiss", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(true);
    bridge.probeDesktop.mockResolvedValue(true);
  });

  it("skipModel flips the model stage to skipped and persists via IPC", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "get_bootstrap_status") return statusStub();
      if (command === "skip_default_model") return undefined;
      throw new Error(`unexpected ${command}`);
    });
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    await flow.skipModel();
    expect(
      flow.stages.value.find((entry) => entry.stage === "downloading-model")?.state,
    ).toBe("skipped");
    expect(bridge.invokeCommand).toHaveBeenCalledWith("skip_default_model");
  });

  it("skipModel surfaces error when IPC throws", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "get_bootstrap_status") return statusStub();
      throw new Error("skip failed");
    });
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    await flow.skipModel();
    expect(flow.error.value).toBe("skip failed");
  });

  it("retryModelDownload clears skip, marks the stage active, and invokes IPC", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "get_bootstrap_status") return statusStub();
      if (command === "retry_default_model_download") return undefined;
      throw new Error(`unexpected ${command}`);
    });
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    await flow.retryModelDownload();
    expect(bridge.invokeCommand).toHaveBeenCalledWith("retry_default_model_download");
    expect(
      flow.stages.value.find((entry) => entry.stage === "downloading-model")?.state,
    ).toBe("active");
  });

  it("retryModelDownload marks stage as error when IPC throws", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "get_bootstrap_status") return statusStub();
      throw new Error("retry boom");
    });
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    await flow.retryModelDownload();
    const entry = flow.stages.value.find((s) => s.stage === "downloading-model");
    expect(entry?.state).toBe("error");
    expect(entry?.message).toBe("retry boom");
    expect(flow.error.value).toBe("retry boom");
  });

  it("dismiss marks first-run complete via IPC and hides the modal", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "get_bootstrap_status") return statusStub();
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

  it("dismiss swallows IPC errors silently and stays dismissed", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "get_bootstrap_status") return statusStub();
      throw new Error("ipc unavailable");
    });
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    await flow.dismiss();
    expect(flow.dismissed.value).toBe(true);
  });
});

describe("useFirstRun — local provider detection", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(true);
    bridge.probeDesktop.mockResolvedValue(true);
    bridge.invokeCommand.mockResolvedValue(statusStub());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("populates detectedProviders and recommended path on start", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ ollama: ["qwen"], lm_studio: ["local"], assignments: [] }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
      ),
    );
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    expect(flow.detectedProviders.value?.ollama).toBe(true);
    expect(flow.detectedProviders.value?.lmStudio).toBe(true);
    expect(flow.recommendedPath.value).toBe("use-local-server");
  });

  it("treats empty arrays as no detection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ ollama: [], lm_studio: [], assignments: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    expect(flow.detectedProviders.value?.ollama).toBe(false);
    expect(flow.detectedProviders.value?.lmStudio).toBe(false);
  });

  it("clears detection and surfaces error when endpoint fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 500 })),
    );
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    expect(flow.detectedProviders.value).toBeNull();
    expect(flow.recommendedPath.value).toBeNull();
    expect(flow.error.value).not.toBeNull();
  });
});

describe("useFirstRun — subscribe and dispose", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(true);
    bridge.probeDesktop.mockResolvedValue(true);
    bridge.invokeCommand.mockResolvedValue(statusStub());
  });

  it("subscribes to bootstrap progress exactly once even across multiple start calls", async () => {
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    await flow.start();
    expect(bridge.listenEvent).toHaveBeenCalledTimes(1);
  });

  it("dispose unlistens once and is idempotent", async () => {
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    await flow.start();
    flow.dispose();
    flow.dispose();
    expect(unlistenSpy).toHaveBeenCalledTimes(1);
  });

  it("dispose without subscribe is a no-op", async () => {
    bridge.isDesktop.mockReturnValue(false);
    bridge.probeDesktop.mockResolvedValue(false);
    const { useFirstRun } = await import("./useFirstRun");
    const flow = useFirstRun();
    flow.dispose();
    expect(unlistenSpy).not.toHaveBeenCalled();
  });
});
