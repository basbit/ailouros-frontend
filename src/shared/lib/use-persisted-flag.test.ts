import { beforeEach, describe, expect, it } from "vitest";
import { usePersistedFlag, usePersistedString } from "./use-persisted-flag";

const KEY = "test.persisted-flag";

describe("usePersistedFlag", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uses the fallback when nothing is stored", () => {
    expect(usePersistedFlag(KEY, true).value).toBe(true);
    expect(usePersistedFlag(KEY, false).value).toBe(false);
  });

  it("prefers a stored 1/0 over the fallback", () => {
    localStorage.setItem(KEY, "0");
    expect(usePersistedFlag(KEY, true).value).toBe(false);
    localStorage.setItem(KEY, "1");
    expect(usePersistedFlag(KEY, false).value).toBe(true);
  });

  it("falls back for a payload no build writes", () => {
    localStorage.setItem(KEY, "open");
    expect(usePersistedFlag(KEY, true).value).toBe(true);
    expect(usePersistedFlag(KEY, false).value).toBe(false);
  });

  it("persists each assignment and reads it back in a fresh composable", () => {
    const flag = usePersistedFlag(KEY, true);

    flag.value = false;
    expect(flag.value).toBe(false);
    expect(localStorage.getItem(KEY)).toBe("0");
    expect(usePersistedFlag(KEY, true).value).toBe(false);

    flag.value = true;
    expect(localStorage.getItem(KEY)).toBe("1");
    expect(usePersistedFlag(KEY, false).value).toBe(true);
  });
});

describe("usePersistedString", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uses the fallback when nothing is stored", () => {
    expect(usePersistedString(KEY, "none").value).toBe("none");
  });

  it("stores the value verbatim, without JSON quoting", () => {
    const ref = usePersistedString(KEY, "");
    ref.value = "origin/main@abc123";
    expect(localStorage.getItem(KEY)).toBe("origin/main@abc123");
    expect(usePersistedString(KEY, "").value).toBe("origin/main@abc123");
  });
});
