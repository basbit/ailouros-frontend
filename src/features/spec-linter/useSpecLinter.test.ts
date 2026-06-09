import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SpecLintReport } from "@/entities/spec-lint";
import { resetSpecLinter, useSpecLinter } from "./useSpecLinter";

const lintMock =
  vi.fn<(input: { scenario: string; specText: string }) => Promise<SpecLintReport>>();

vi.mock("@/shared/api/endpoints/spec-linter", () => ({
  lintSpec: (input: { scenario: string; specText: string }) => lintMock(input),
}));

function makeReport(overrides: Partial<SpecLintReport> = {}): SpecLintReport {
  return {
    scenario: "default",
    findings: [],
    counts: { error: 0, warning: 0, info: 0 },
    blockingCount: 0,
    hasErrors: false,
    ...overrides,
  };
}

describe("useSpecLinter", () => {
  beforeEach(() => {
    resetSpecLinter();
    lintMock.mockReset();
  });

  it("skips the request when scenario or spec text is blank", async () => {
    const composable = useSpecLinter();
    await composable.run({ scenario: "   ", specText: "stuff" });
    await composable.run({ scenario: "default", specText: "   " });
    expect(lintMock).not.toHaveBeenCalled();
    expect(composable.report.value).toBeNull();
  });

  it("trims scenario and spec text before invoking the endpoint", async () => {
    lintMock.mockResolvedValue(makeReport());
    const composable = useSpecLinter();
    await composable.run({
      scenario: "  default  ",
      specText: "  spec body  ",
    });
    expect(lintMock).toHaveBeenCalledWith({
      scenario: "default",
      specText: "spec body",
    });
  });

  it("stores the report and clears loading after success", async () => {
    const report = makeReport({
      scenario: "code-feature",
      blockingCount: 2,
      hasErrors: true,
    });
    lintMock.mockResolvedValue(report);
    const composable = useSpecLinter();
    await composable.run({ scenario: "code-feature", specText: "spec" });
    expect(composable.report.value?.blockingCount).toBe(2);
    expect(composable.report.value?.hasErrors).toBe(true);
    expect(composable.loading.value).toBe(false);
    expect(composable.visible.value).toBe(true);
  });

  it("records the error message when the endpoint throws", async () => {
    lintMock.mockRejectedValue(new Error("500 lint failed"));
    const composable = useSpecLinter();
    await composable.run({ scenario: "default", specText: "spec" });
    expect(composable.report.value).toBeNull();
    expect(composable.lastError.value).toBe("500 lint failed");
    expect(composable.loading.value).toBe(false);
  });

  it("clears the stored report when clear is called", async () => {
    lintMock.mockResolvedValue(makeReport({ scenario: "x" }));
    const composable = useSpecLinter();
    await composable.run({ scenario: "x", specText: "spec" });
    composable.clear();
    expect(composable.report.value).toBeNull();
    expect(composable.visible.value).toBe(false);
  });
});
