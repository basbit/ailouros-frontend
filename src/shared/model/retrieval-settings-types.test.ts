import { describe, expect, it } from "vitest";

import { parseRetrievalSettingsPayload } from "./retrieval-settings-types";

describe("parseRetrievalSettingsPayload", () => {
  it("returns null for a non-object payload", () => {
    expect(parseRetrievalSettingsPayload(null)).toBeNull();
    expect(parseRetrievalSettingsPayload("nope")).toBeNull();
  });

  it("returns null for an empty payload (backend currently returns {})", () => {
    expect(parseRetrievalSettingsPayload({})).toBeNull();
  });

  it("returns a settings object for a non-empty payload", () => {
    const parsed = parseRetrievalSettingsPayload({ some_future_field: true });
    expect(parsed).not.toBeNull();
    expect(parsed?._placeholder).toBe(true);
  });
});
