import { describe, expect, it, vi } from "vitest";

import { useHistoryDetailTabs, type HistoryTabKey } from "./useHistoryDetailTabs";

function makeTranslator(): (key: string) => string {
  return vi.fn((key: string) => key);
}

describe("useHistoryDetailTabs", () => {
  it("exposes the redesigned top-level tab set in order", () => {
    const { tabs } = useHistoryDetailTabs(makeTranslator());
    expect(tabs.value.map((tab) => tab.key)).toEqual<HistoryTabKey[]>([
      "run",
      "activity",
      "artifacts",
      "tokens",
      "graphs",
    ]);
  });

  it("no longer exposes the separate spec and graph top-level tabs", () => {
    const { tabs } = useHistoryDetailTabs(makeTranslator());
    const keys = tabs.value.map((tab) => tab.key) as string[];
    expect(keys).not.toContain("spec");
    expect(keys).not.toContain("graph");
  });

  it("defaults to the run tab", () => {
    const { activeTab } = useHistoryDetailTabs(makeTranslator());
    expect(activeTab.value).toBe("run");
  });

  it("labels each tab via the translator", () => {
    const { tabs } = useHistoryDetailTabs(makeTranslator());
    expect(tabs.value.map((tab) => tab.label)).toEqual([
      "history.detail.tab.run",
      "history.detail.tab.activity",
      "history.detail.tab.artifacts",
      "history.detail.tab.tokens",
      "history.detail.tab.graphs",
    ]);
  });
});
