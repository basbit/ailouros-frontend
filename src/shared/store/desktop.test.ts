import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("@/shared/api/endpoints/desktop", () => ({
  getDesktopInfo: vi.fn(),
}));

import { useDesktopStore } from "@/shared/store/desktop";
import { getDesktopInfo } from "@/shared/api/endpoints/desktop";

describe("desktop store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(getDesktopInfo).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in not-desktop state until loaded", () => {
    const store = useDesktopStore();
    expect(store.info).toEqual({ is_desktop: false, workspaces_dir: null });
    expect(store.loaded).toBe(false);
  });

  it("ensureLoaded caches the result and skips repeat calls", async () => {
    vi.mocked(getDesktopInfo).mockResolvedValue({
      is_desktop: true,
      workspaces_dir: "/tmp/ws",
    });
    const store = useDesktopStore();

    const first = await store.ensureLoaded();
    const second = await store.ensureLoaded();

    expect(first).toEqual({ is_desktop: true, workspaces_dir: "/tmp/ws" });
    expect(second).toEqual(first);
    expect(getDesktopInfo).toHaveBeenCalledTimes(1);
    expect(store.info).toEqual({ is_desktop: true, workspaces_dir: "/tmp/ws" });
    expect(store.loaded).toBe(true);
  });

  it("deduplicates concurrent ensureLoaded calls", async () => {
    let resolve!: (value: { is_desktop: boolean; workspaces_dir: null }) => void;
    vi.mocked(getDesktopInfo).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const store = useDesktopStore();

    const a = store.ensureLoaded();
    const b = store.ensureLoaded();
    resolve({ is_desktop: false, workspaces_dir: null });
    const [first, second] = await Promise.all([a, b]);

    expect(first).toEqual(second);
    expect(getDesktopInfo).toHaveBeenCalledTimes(1);
  });
});
