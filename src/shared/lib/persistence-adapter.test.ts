import { beforeEach, describe, expect, it } from "vitest";
import { persistenceAdapter, readTypedJson, writeTypedJson } from "./persistence-adapter";

const TYPED = { key: "test.typed-json", default: { roles: [] as string[] } };

describe("readTypedJson", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the default for an absent or empty key", () => {
    expect(readTypedJson(TYPED)).toEqual({ roles: [] });
    localStorage.setItem(TYPED.key, "");
    expect(readTypedJson(TYPED)).toEqual({ roles: [] });
  });

  it("returns the stored payload", () => {
    writeTypedJson(TYPED, { roles: ["dev"] });
    expect(readTypedJson(TYPED)).toEqual({ roles: ["dev"] });
  });

  it("returns the default for a malformed payload instead of throwing", () => {
    // A truncated write must not take down a module initialiser that reads
    // its cached snapshot at import time (e.g. use-swarm-defaults).
    localStorage.setItem(TYPED.key, '{"roles":["dev"');
    expect(() => readTypedJson(TYPED)).not.toThrow();
    expect(readTypedJson(TYPED)).toEqual({ roles: [] });
  });

  it("returns the default for a stored JSON null", () => {
    localStorage.setItem(TYPED.key, "null");
    expect(readTypedJson(TYPED)).toEqual({ roles: [] });
  });
});

describe("writeTypedJson", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("writes JSON text the raw reader can parse", () => {
    writeTypedJson(TYPED, { roles: ["pm", "dev"] });
    expect(persistenceAdapter.readString(TYPED.key)).toBe('{"roles":["pm","dev"]}');
  });
});
