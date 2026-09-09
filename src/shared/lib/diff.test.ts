import { describe, expect, it } from "vitest";
import { computeLineDiff } from "./diff";

describe("computeLineDiff", () => {
  it("returns unchanged lines for identical texts", () => {
    const text = "first line\nsecond line\nthird line";
    const result = computeLineDiff(text, text);

    expect(result.hasChanges).toBe(false);
    expect(result.addedCount).toBe(0);
    expect(result.removedCount).toBe(0);
    expect(result.unchangedCount).toBe(3);
    expect(result.lines).toHaveLength(3);
    expect(result.lines[0]).toEqual({
      type: "unchanged",
      text: "first line",
      originalLineNumber: 1,
      modifiedLineNumber: 1,
    });
  });

  it("detects added lines", () => {
    const orig = "line 1\nline 3";
    const mod = "line 1\nline 2\nline 3";
    const result = computeLineDiff(orig, mod);

    expect(result.hasChanges).toBe(true);
    expect(result.addedCount).toBe(1);
    expect(result.removedCount).toBe(0);
    expect(result.lines.find((l) => l.type === "added")).toEqual({
      type: "added",
      text: "line 2",
      originalLineNumber: null,
      modifiedLineNumber: 2,
    });
  });

  it("detects removed lines", () => {
    const orig = "line 1\nline 2\nline 3";
    const mod = "line 1\nline 3";
    const result = computeLineDiff(orig, mod);

    expect(result.hasChanges).toBe(true);
    expect(result.addedCount).toBe(0);
    expect(result.removedCount).toBe(1);
    expect(result.lines.find((l) => l.type === "removed")).toEqual({
      type: "removed",
      text: "line 2",
      originalLineNumber: 2,
      modifiedLineNumber: null,
    });
  });

  it("handles empty text gracefully", () => {
    const result = computeLineDiff("", "");
    expect(result.hasChanges).toBe(false);
    expect(result.lines).toHaveLength(0);
  });
});
