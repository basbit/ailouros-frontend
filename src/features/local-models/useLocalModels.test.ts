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

    await models.startDownload("anything");
    expect(models.download.error).toBe("desktop-only");
  });
});

describe("useLocalModels — desktop mode", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(true);
    bridge.probeDesktop.mockResolvedValue(true);
    bridge.listenEvent.mockResolvedValue(() => {});
  });

  it("populates available + onDisk via list_available_models / list_local_models", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "list_available_models") {
        return [
          {
            entry: {
              id: "gemma-4-e4b-it-q4-k-m",
              label: "Gemma 4 E4B Q4_K_M",
              family: "gemma-4",
              params: "E4B",
              quant: "Q4KM",
              format: "gguf",
              size_bytes: 5_340_000_000,
              source: { url: "https://example/x.gguf", sha256: null },
              license: "Gemma TOS",
              default: true,
              supported_runtimes: ["llama.cpp"],
            },
            on_disk: false,
            is_default: true,
          },
        ];
      }
      if (command === "list_local_models") return [];
      throw new Error(`unexpected command ${command}`);
    });

    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    await models.refresh();

    expect(models.available.value).toHaveLength(1);
    expect(models.defaultEntry.value?.entry.id).toBe("gemma-4-e4b-it-q4-k-m");
    expect(models.onDisk.value).toEqual([]);
    expect(models.loadError.value).toBeNull();
  });

  it("surfaces refresh errors instead of swallowing them", async () => {
    bridge.invokeCommand.mockRejectedValue(new Error("boom"));
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    await models.refresh();
    expect(models.loadError.value).toBe("boom");
    expect(models.loading.value).toBe(false);
  });

  it("rejects concurrent downloads and clears active on success", async () => {
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "download_model") return undefined;
      if (command === "list_available_models") return [];
      if (command === "list_local_models") return [];
      throw new Error(`unexpected ${command}`);
    });
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    const inflight = models.startDownload("a");
    await models.startDownload("b");
    expect(models.download.error).toMatch(/another download is in progress/);
    await inflight;
    expect(models.download.active).toBeNull();
  });

  it("subscribes once to bootstrap progress events", async () => {
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

  it("upgrades to desktop via probe when sync check returns false", async () => {
    bridge.isDesktop.mockReturnValue(false);
    bridge.probeDesktop.mockResolvedValue(true);
    bridge.invokeCommand.mockImplementation(async (command) => {
      if (command === "list_available_models") return [];
      if (command === "list_local_models") return [];
      throw new Error(`unexpected ${command}`);
    });
    const { useLocalModels } = await import("./useLocalModels");
    const models = useLocalModels();
    await models.refresh();
    expect(models.isDesktop.value).toBe(true);
    expect(bridge.probeDesktop).toHaveBeenCalled();
  });
});
