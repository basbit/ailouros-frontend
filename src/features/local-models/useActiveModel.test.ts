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
  vi.useRealTimers();
});

describe("useActiveModel — browser fallback", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(false);
    bridge.probeDesktop.mockResolvedValue(false);
  });

  it("reports cloud kind when not in desktop", async () => {
    const { useActiveModel } = await import("./useActiveModel");
    const state = useActiveModel();
    await state.refresh();
    expect(state.view.value.kind).toBe("cloud");
  });
});

describe("useActiveModel — desktop", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(true);
    bridge.probeDesktop.mockResolvedValue(true);
  });

  it("reports local kind when default model is on disk", async () => {
    bridge.invokeCommand.mockResolvedValue([
      {
        entry: {
          id: "gemma-4-e4b",
          label: "Gemma 4 E4B",
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
        on_disk: true,
        is_default: true,
      },
    ]);
    const { useActiveModel } = await import("./useActiveModel");
    const state = useActiveModel();
    await state.refresh();
    expect(state.view.value.kind).toBe("local");
    expect(state.view.value.label).toBe("Gemma 4 E4B");
  });

  it("reports none when default model is missing on disk", async () => {
    bridge.invokeCommand.mockResolvedValue([
      {
        entry: {
          id: "gemma-4-e4b",
          label: "Gemma 4 E4B",
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
    ]);
    const { useActiveModel } = await import("./useActiveModel");
    const state = useActiveModel();
    await state.refresh();
    expect(state.view.value.kind).toBe("none");
    expect(state.view.value.label).toBeNull();
  });
});
