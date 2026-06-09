import { describe, expect, it } from "vitest";

import { parseSpecLintReportPayload } from "./spec-lint-types";

describe("parseSpecLintReportPayload", () => {
  it("returns null when scenario is missing", () => {
    expect(parseSpecLintReportPayload({})).toBeNull();
    expect(parseSpecLintReportPayload({ scenario: "" })).toBeNull();
  });

  it("returns null when payload is not an object", () => {
    expect(parseSpecLintReportPayload(null)).toBeNull();
    expect(parseSpecLintReportPayload("text")).toBeNull();
  });

  it("parses a full report with mixed severities", () => {
    const parsed = parseSpecLintReportPayload({
      scenario: "code-feature",
      findings: [
        {
          rule_id: "required-sections",
          severity: "error",
          message: "Missing acceptance",
          span_start: 0,
          span_end: 12,
        },
        {
          rule_id: "ambiguity",
          severity: "warning",
          message: "Phrase 'maybe'",
          span_start: 30,
          span_end: 35,
        },
      ],
      counts: { error: 1, warning: 1, info: 0 },
      blocking_count: 1,
      has_errors: true,
    });
    expect(parsed?.scenario).toBe("code-feature");
    expect(parsed?.findings).toHaveLength(2);
    expect(parsed?.findings[0]?.severity).toBe("error");
    expect(parsed?.counts.error).toBe(1);
    expect(parsed?.blockingCount).toBe(1);
    expect(parsed?.hasErrors).toBe(true);
  });

  it("drops findings without rule_id and defaults unknown severities to info", () => {
    const parsed = parseSpecLintReportPayload({
      scenario: "default",
      findings: [
        { rule_id: "", severity: "error", message: "anon" },
        { rule_id: "ok", severity: "bogus", message: "x" },
      ],
    });
    expect(parsed?.findings).toHaveLength(1);
    expect(parsed?.findings[0]?.severity).toBe("info");
  });

  it("defaults blocking_count to zero when missing", () => {
    const parsed = parseSpecLintReportPayload({ scenario: "x" });
    expect(parsed?.blockingCount).toBe(0);
    expect(parsed?.hasErrors).toBe(false);
    expect(parsed?.findings).toEqual([]);
  });
});
