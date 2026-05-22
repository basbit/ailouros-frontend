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
  unlistenSpy = vi.fn();
  bridge.listenEvent.mockImplementation(async (_name, handler) => {
    capturedProgressHandler = handler;
    return (() => unlistenSpy()) as () => void;
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

function makeModelEntry(overrides: Record<string, unknown> = {}): unknown {
  return {
    entry: {
      id: "gemma-test",
      label: "Gemma",
      family: "gemma",
      params: "E4B",
      quant: "Q4KM",
      format: "gguf",
      size_bytes: 1000,
      source: { url: "https://example/x.gguf", sha256: null },
      license: "TOS",
      default: false,
      supported_runtimes: ["llama.cpp"],
    },
    on_disk: false,
    is_default: false,
    ...overrides,
  };
}

describe("useLocalModels — browser fallback", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(false);
    bridge.probeDesktop.mockResolvedValue(false);
  });

  it("reports isDesktop=false and never invokes IPC", async () => {
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    expect(models.isDesktop.value).toBe(false);
    await models.refresh();
    expect(bridge.invokeCommand).not.toHaveBeenCalled();
  });

  it("startDownload sets desktop-only error when probe also fails", async () => {
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    await models.startDownload("anything");
    expect(models.download.error).toBe("desktop-only");
    expect(bridge.invokeCommand).not.toHaveBeenCalled();
  });
});

describe("useLocalModels.refresh — desktop mode", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(true);
    bridge.probeDesktop.mockResolvedValue(true);
  });

  it("populates available + onDisk and selects default entry", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "list_available_models") {
        return [makeModelEntry({ is_default: true })];
      }
      if (command === "list_local_models") {
        return [{ id: "local-1", path: "/p", size_bytes: 1 }];
      }
      throw new Error(`unexpected ${command}`);
    });

    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    await models.refresh();

    expect(models.available.value).toHaveLength(1);
    expect(models.onDisk.value).toHaveLength(1);
    expect(models.defaultEntry.value?.is_default).toBe(true);
    expect(models.loadError.value).toBeNull();
    expect(models.loading.value).toBe(false);
  });

  it("returns null defaultEntry when no model is flagged as default", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "list_available_models") {
        return [makeModelEntry({ is_default: false })];
      }
      if (command === "list_local_models") return [];
      throw new Error(`unexpected ${command}`);
    });
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    await models.refresh();
    expect(models.defaultEntry.value).toBeNull();
  });

  it("flips loading flag during call and back when settled", async () => {
    let resolveAvailable: ((value: unknown) => void) | null = null;
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "list_local_models") return [];
      if (command === "list_available_models") {
        return new Promise((resolve) => {
          resolveAvailable = resolve;
        });
      }
      return [];
    });
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    const promise = models.refresh();
    await vi.waitFor(() => expect(resolveAvailable).not.toBeNull());
    expect(models.loading.value).toBe(true);
    resolveAvailable!([]);
    await promise;
    expect(models.loading.value).toBe(false);
  });

  it("surfaces Error.message on failure and clears loading", async () => {
    bridge.invokeCommand.mockRejectedValue(new Error("boom"));
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    await models.refresh();
    expect(models.loadError.value).toBe("boom");
    expect(models.loading.value).toBe(false);
  });

  it("stringifies non-Error throwables", async () => {
    bridge.invokeCommand.mockRejectedValue("a string error");
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    await models.refresh();
    expect(models.loadError.value).toBe("a string error");
  });

  it("upgrades to desktop via probe when sync check returns false", async () => {
    bridge.isDesktop.mockReturnValue(false);
    bridge.invokeCommand.mockResolvedValue([]);
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    await models.refresh();
    expect(models.isDesktop.value).toBe(true);
    expect(bridge.probeDesktop).toHaveBeenCalled();
  });
});

describe("useLocalModels.startDownload", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(true);
    bridge.probeDesktop.mockResolvedValue(true);
  });

  it("rejects concurrent downloads and clears active on success", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "download_model") return undefined;
      return [];
    });
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    const inflight = models.startDownload("a");
    await models.startDownload("b");
    expect(models.download.error).toMatch(/another download is in progress/);
    await inflight;
    expect(models.download.active).toBeNull();
  });

  it("marks fraction=1 and message='done' after successful download", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "download_model") return undefined;
      return [];
    });
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    await models.startDownload("model-x");
    expect(models.download.fraction["model-x"]).toBe(1);
    expect(models.download.message["model-x"]).toBe("done");
    expect(models.download.active).toBeNull();
  });

  it("initialises fraction=0 and message='starting' when starting", async () => {
    let resolveDownload: (() => void) | null = null;
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "download_model") {
        return new Promise<void>((resolve) => {
          resolveDownload = resolve;
        });
      }
      return [];
    });
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    const promise = models.startDownload("z");
    await vi.waitFor(() => expect(resolveDownload).not.toBeNull());
    expect(models.download.fraction["z"]).toBe(0);
    expect(models.download.message["z"]).toBe("starting");
    expect(models.download.active).toBe("z");
    resolveDownload!();
    await promise;
  });

  it("subscribes once to bootstrap progress events across downloads", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "download_model") return undefined;
      return [];
    });
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    await models.startDownload("a");
    await models.startDownload("b");
    expect(bridge.listenEvent).toHaveBeenCalledTimes(1);
  });

  it("progress event updates fraction and message for the active download", async () => {
    let resolveDownload: (() => void) | null = null;
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "download_model") {
        return new Promise<void>((resolve) => {
          resolveDownload = resolve;
        });
      }
      return [];
    });
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    const promise = models.startDownload("active-id");
    await vi.waitFor(() => expect(capturedProgressHandler).not.toBeNull());
    capturedProgressHandler!({
      stage: "downloading-model",
      fraction: 0.42,
      message: "downloading chunk 5",
    });
    expect(models.download.fraction["active-id"]).toBeCloseTo(0.42);
    expect(models.download.message["active-id"]).toBe("downloading chunk 5");
    resolveDownload!();
    await promise;
  });

  it("progress events for unrelated stages are ignored", async () => {
    let resolveDownload: (() => void) | null = null;
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "download_model") {
        return new Promise<void>((resolve) => {
          resolveDownload = resolve;
        });
      }
      return [];
    });
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    const promise = models.startDownload("x");
    await vi.waitFor(() => expect(capturedProgressHandler).not.toBeNull());
    capturedProgressHandler!({
      stage: "fetching-python",
      fraction: 0.9,
      message: "unrelated",
    });
    expect(models.download.message["x"]).toBe("starting");
    resolveDownload!();
    await promise;
  });

  it("surfaces Error.message on download failure and clears active", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "download_model") throw new Error("download failed");
      return [];
    });
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    await models.startDownload("z");
    expect(models.download.error).toBe("download failed");
    expect(models.download.active).toBeNull();
  });

  it("stringifies non-Error throwables on download failure", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "download_model") throw "fatal string";
      return [];
    });
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    await models.startDownload("z");
    expect(models.download.error).toBe("fatal string");
  });

  it("refreshes available/onDisk lists after successful download", async () => {
    const refreshCalls: string[] = [];
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "download_model") return undefined;
      refreshCalls.push(command);
      return [];
    });
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    await models.startDownload("z");
    expect(refreshCalls).toContain("list_available_models");
    expect(refreshCalls).toContain("list_local_models");
  });
});

describe("useLocalModels.dispose", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(true);
    bridge.probeDesktop.mockResolvedValue(true);
  });

  it("calls the captured unlisten function exactly once", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "download_model") return undefined;
      return [];
    });
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    await models.startDownload("z");
    models.dispose();
    models.dispose();
    expect(unlistenSpy).toHaveBeenCalledTimes(1);
  });

  it("dispose without prior subscription is a no-op", async () => {
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    models.dispose();
    expect(unlistenSpy).not.toHaveBeenCalled();
  });
});
