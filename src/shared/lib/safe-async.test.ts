import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const warnSpy = vi.fn();
vi.mock("@/shared/lib/frontend-logger", () => ({
  frontendLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: (...args: unknown[]) => warnSpy(...args),
    error: vi.fn(),
  },
}));

import { safeWarn, runCatchingWarn, parseJsonOr } from "@/shared/lib/safe-async";

describe("safeWarn", () => {
  beforeEach(() => warnSpy.mockReset());

  it("runs the side effect and does not warn on success", () => {
    let ran = false;
    safeWarn("ctx: ok", () => {
      ran = true;
    });
    expect(ran).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("swallows the thrown error and warns with the context message", () => {
    const err = new Error("boom");
    safeWarn("ctx: failed", () => {
      throw err;
    });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith("ctx: failed", err);
  });
});

describe("runCatchingWarn", () => {
  beforeEach(() => warnSpy.mockReset());

  it("returns the resolved value and does not warn on success", async () => {
    const value = await runCatchingWarn(async () => 42, -1, "ctx: ok");
    expect(value).toBe(42);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns the fallback and warns when the operation rejects", async () => {
    const err = new Error("network");
    const value = await runCatchingWarn(
      async () => {
        throw err;
      },
      "fallback",
      "ctx: network error",
    );
    expect(value).toBe("fallback");
    expect(warnSpy).toHaveBeenCalledWith("ctx: network error", err);
  });

  it("returns the fallback when a synchronous throw happens before the promise", async () => {
    const value = await runCatchingWarn<number>(
      () => {
        throw new Error("sync throw");
      },
      0,
      "ctx: sync",
    );
    expect(value).toBe(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

describe("parseJsonOr", () => {
  beforeEach(() => warnSpy.mockReset());

  afterEach(() => vi.restoreAllMocks());

  it("parses valid JSON", () => {
    expect(parseJsonOr<number[]>("[1,2,3]", [])).toEqual([1, 2, 3]);
  });

  it("returns the fallback for null/empty input without warning", () => {
    expect(parseJsonOr<unknown[]>(null, [])).toEqual([]);
    expect(parseJsonOr<unknown[]>("", [])).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns the fallback and warns (with context) for malformed JSON", () => {
    const fallback = { a: 1 };
    expect(parseJsonOr("{not json", fallback, "ctx: bad json")).toBe(fallback);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("does not warn for malformed JSON when no context is given", () => {
    expect(parseJsonOr("{not json", [])).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
