import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isDesktop, listenEvent, probeDesktop } from "./desktop-bridge";

const TAURI_INTERNALS = "__TAURI_INTERNALS__" as const;
const TAURI_GLOBAL = "__TAURI__" as const;
const TAURI_FLAG = "isTauri" as const;

const originalUserAgent = navigator.userAgent;

beforeEach(() => {
  Object.defineProperty(navigator, "userAgent", {
    value: originalUserAgent,
    configurable: true,
  });
});

afterEach(() => {
  for (const key of [TAURI_INTERNALS, TAURI_GLOBAL, TAURI_FLAG]) {
    delete (window as unknown as Record<string, unknown>)[key];
  }
  Object.defineProperty(navigator, "userAgent", {
    value: originalUserAgent,
    configurable: true,
  });
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("isDesktop", () => {
  it("returns false outside Tauri", () => {
    expect(isDesktop()).toBe(false);
  });

  it("detects window.__TAURI_INTERNALS__", () => {
    (window as unknown as Record<string, unknown>)[TAURI_INTERNALS] = {};
    expect(isDesktop()).toBe(true);
  });

  it("detects window.__TAURI__", () => {
    (window as unknown as Record<string, unknown>)[TAURI_GLOBAL] = {};
    expect(isDesktop()).toBe(true);
  });

  it("detects window.isTauri", () => {
    (window as unknown as Record<string, unknown>)[TAURI_FLAG] = true;
    expect(isDesktop()).toBe(true);
  });

  it("detects Tauri user agent", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Tauri/2.10",
      configurable: true,
    });
    expect(isDesktop()).toBe(true);
  });

  it("treats user agent case-insensitively (TAURI uppercase)", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "TAURI/2.10",
      configurable: true,
    });
    expect(isDesktop()).toBe(true);
  });

  it("returns false when user agent has no Tauri marker", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Safari/605.1.15",
      configurable: true,
    });
    expect(isDesktop()).toBe(false);
  });
});

describe("probeDesktop", () => {
  it("returns true when sync detection already passes (no IPC needed)", async () => {
    (window as unknown as Record<string, unknown>)[TAURI_INTERNALS] = {};
    const invoke = vi.fn();
    vi.doMock("@tauri-apps/api/core", () => ({ invoke }));
    expect(await probeDesktop()).toBe(true);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("falls back to invoke and returns true when it succeeds", async () => {
    const invoke = vi.fn(async () => true);
    vi.doMock("@tauri-apps/api/core", () => ({ invoke }));
    const { probeDesktop: freshProbe } = await import("./desktop-bridge");
    expect(await freshProbe()).toBe(true);
    expect(invoke).toHaveBeenCalledWith("get_desktop_mode");
  });

  it("returns false when invoke throws", async () => {
    const invoke = vi.fn(async () => {
      throw new Error("not in tauri");
    });
    vi.doMock("@tauri-apps/api/core", () => ({ invoke }));
    const { probeDesktop: freshProbe } = await import("./desktop-bridge");
    expect(await freshProbe()).toBe(false);
  });

  it("returns false when the dynamic import itself rejects", async () => {
    vi.doMock("@tauri-apps/api/core", () => {
      throw new Error("module not found");
    });
    const { probeDesktop: freshProbe } = await import("./desktop-bridge");
    expect(await freshProbe()).toBe(false);
  });
});

describe("invokeCommand", () => {
  it("delegates to @tauri-apps/api/core with args", async () => {
    const invoke = vi.fn(async () => "result");
    vi.doMock("@tauri-apps/api/core", () => ({ invoke }));
    const { invokeCommand: freshInvoke } = await import("./desktop-bridge");
    const result = await freshInvoke<string>("get_desktop_mode", { id: "x" });
    expect(invoke).toHaveBeenCalledWith("get_desktop_mode", { id: "x" });
    expect(result).toBe("result");
  });

  it("delegates without args when none are provided", async () => {
    const invoke = vi.fn(async () => undefined);
    vi.doMock("@tauri-apps/api/core", () => ({ invoke }));
    const { invokeCommand: freshInvoke } = await import("./desktop-bridge");
    await freshInvoke<void>("ping");
    expect(invoke).toHaveBeenCalledWith("ping", undefined);
  });

  it("propagates errors from invoke", async () => {
    const invoke = vi.fn(async () => {
      throw new Error("boom");
    });
    vi.doMock("@tauri-apps/api/core", () => ({ invoke }));
    const { invokeCommand: freshInvoke } = await import("./desktop-bridge");
    await expect(freshInvoke("get_x")).rejects.toThrow("boom");
  });
});

describe("listenEvent", () => {
  it("returns a no-op unlisten outside Tauri", async () => {
    const unlisten = await listenEvent("any", () => undefined);
    expect(typeof unlisten).toBe("function");
    expect(() => unlisten()).not.toThrow();
  });

  it("does not invoke event listener when not in desktop", async () => {
    const listen = vi.fn();
    vi.doMock("@tauri-apps/api/event", () => ({ listen }));
    const { listenEvent: freshListen } = await import("./desktop-bridge");
    await freshListen("any", () => undefined);
    expect(listen).not.toHaveBeenCalled();
  });

  it("subscribes via @tauri-apps/api/event when Tauri is detected", async () => {
    (window as unknown as Record<string, unknown>)[TAURI_INTERNALS] = {};
    const unlistenInner = vi.fn();
    const listen = vi.fn(async (name: string) => {
      expect(name).toBe("ping");
      return unlistenInner;
    });
    vi.doMock("@tauri-apps/api/event", () => ({ listen }));
    const { listenEvent: freshListen } = await import("./desktop-bridge");
    const handler = vi.fn();
    const unlisten = await freshListen<string>("ping", handler);
    expect(listen).toHaveBeenCalledTimes(1);
    unlisten();
    expect(unlistenInner).toHaveBeenCalledTimes(1);
  });

  it("unwraps event.payload and forwards it to the consumer handler", async () => {
    (window as unknown as Record<string, unknown>)[TAURI_INTERNALS] = {};
    let captured: ((event: { payload: string }) => void) | null = null;
    const listen = vi.fn(
      async (_name: string, callback: (e: { payload: string }) => void) => {
        captured = callback;
        return () => undefined;
      },
    );
    vi.doMock("@tauri-apps/api/event", () => ({ listen }));
    const { listenEvent: freshListen } = await import("./desktop-bridge");
    const handler = vi.fn();
    await freshListen<string>("any", handler);
    captured!({ payload: "hello world" });
    expect(handler).toHaveBeenCalledWith("hello world");
  });
});

describe("DESKTOP_EVENTS", () => {
  it("exposes the bootstrap progress event id", async () => {
    const { DESKTOP_EVENTS } = await import("./desktop-bridge");
    expect(DESKTOP_EVENTS.bootstrapProgress).toBe("bootstrap://progress");
  });
});
