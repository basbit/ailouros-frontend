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

beforeEach(() => {
  bridge.listenEvent.mockResolvedValue(vi.fn<() => void>() as () => void);
});

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
