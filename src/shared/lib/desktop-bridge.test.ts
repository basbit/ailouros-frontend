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
});

describe("probeDesktop", () => {
  it("returns true when sync detection already passes", async () => {
    (window as unknown as Record<string, unknown>)[TAURI_INTERNALS] = {};
    expect(await probeDesktop()).toBe(true);
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
});

describe("invokeCommand", () => {
  it("delegates to @tauri-apps/api/core", async () => {
    const invoke = vi.fn(async () => "result");
    vi.doMock("@tauri-apps/api/core", () => ({ invoke }));
    const { invokeCommand: freshInvoke } = await import("./desktop-bridge");
    const result = await freshInvoke<string>("get_desktop_mode", { id: "x" });
    expect(invoke).toHaveBeenCalledWith("get_desktop_mode", { id: "x" });
    expect(result).toBe("result");
  });
});

describe("listenEvent", () => {
  it("returns a no-op unlisten outside Tauri", async () => {
    const unlisten = await listenEvent("any", () => {});
    expect(typeof unlisten).toBe("function");
    expect(() => unlisten()).not.toThrow();
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
});
