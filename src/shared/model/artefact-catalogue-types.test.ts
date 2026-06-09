import { describe, expect, it } from "vitest";

import { parseArtefactReportPayload } from "./artefact-catalogue-types";

describe("parseArtefactReportPayload", () => {
  it("returns null when scenario is missing", () => {
    expect(parseArtefactReportPayload({})).toBeNull();
    expect(parseArtefactReportPayload(null)).toBeNull();
  });

  it("parses a full report from snake_case payload", () => {
    const parsed = parseArtefactReportPayload({
      scenario: "code-feature",
      required: ["features", "stack"],
      present_by_category: {
        features: [{ filename: "features.md", content_length: 120 }],
        stack: [{ filename: "stack.md", content_length: 0 }],
      },
      missing: [],
      empty: ["stack"],
      uncategorised: ["notes.txt"],
      is_complete: false,
    });
    expect(parsed?.scenario).toBe("code-feature");
    expect(parsed?.required).toEqual(["features", "stack"]);
    expect(parsed?.presentByCategory.features?.[0].contentLength).toBe(120);
    expect(parsed?.empty).toEqual(["stack"]);
    expect(parsed?.uncategorised).toEqual(["notes.txt"]);
    expect(parsed?.isComplete).toBe(false);
  });

  it("treats missing is_complete as true", () => {
    const parsed = parseArtefactReportPayload({ scenario: "default" });
    expect(parsed?.isComplete).toBe(true);
    expect(parsed?.required).toEqual([]);
    expect(parsed?.presentByCategory).toEqual({});
  });

  it("drops malformed present entries", () => {
    const parsed = parseArtefactReportPayload({
      scenario: "default",
      present_by_category: {
        features: [
          { filename: "good.md", content_length: 10 },
          { content_length: 20 },
          "not-an-object",
        ],
      },
    });
    expect(parsed?.presentByCategory.features).toHaveLength(1);
    expect(parsed?.presentByCategory.features?.[0].filename).toBe("good.md");
  });
});
