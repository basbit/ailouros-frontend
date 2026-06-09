import { describe, expect, it } from "vitest";

import { parseQuickFixDecisionPayload } from "./quick-fix-types";

describe("parseQuickFixDecisionPayload", () => {
  it("returns null when verdict is missing or unknown", () => {
    expect(parseQuickFixDecisionPayload({})).toBeNull();
    expect(parseQuickFixDecisionPayload({ verdict: "maybe" })).toBeNull();
  });

  it("returns null when payload is not an object", () => {
    expect(parseQuickFixDecisionPayload(null)).toBeNull();
    expect(parseQuickFixDecisionPayload("accept")).toBeNull();
  });

  it("parses a full accept payload", () => {
    const parsed = parseQuickFixDecisionPayload({
      verdict: "accept",
      reason: "single file under budget",
      blocking_file: "",
      blocking_rule: "",
      max_loc: 20,
    });
    expect(parsed?.verdict).toBe("accept");
    expect(parsed?.maxLoc).toBe(20);
  });

  it("parses a reject payload with blocking metadata", () => {
    const parsed = parseQuickFixDecisionPayload({
      verdict: "reject",
      reason: "matched deny rule",
      blocking_file: "src/secrets.py",
      blocking_rule: "deny:secrets",
      max_loc: 10,
    });
    expect(parsed?.verdict).toBe("reject");
    expect(parsed?.blockingFile).toBe("src/secrets.py");
    expect(parsed?.blockingRule).toBe("deny:secrets");
  });

  it("coerces non-integer max_loc to zero", () => {
    const parsed = parseQuickFixDecisionPayload({
      verdict: "accept",
      max_loc: "lots",
    });
    expect(parsed?.maxLoc).toBe(0);
  });
});
