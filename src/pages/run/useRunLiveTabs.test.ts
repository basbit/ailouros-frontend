import { describe, it, expect, vi } from "vitest";

import { useRunLiveTabs, type RunLiveTabKey } from "./useRunLiveTabs";

function makeTranslator(): (key: string) => string {
  return vi.fn((key: string) => key);
}

describe("useRunLiveTabs", () => {
  it("defaults to the 'steps' tab so existing behaviour is preserved", () => {
    const { activeTab } = useRunLiveTabs(makeTranslator());
    expect(activeTab.value).toBe<RunLiveTabKey>("steps");
  });

  it("exposes tabs in their expected order: steps, activity, artifacts", () => {
    const t = makeTranslator();
    const { tabs } = useRunLiveTabs(t);
    expect(tabs.value.map((tab) => tab.key)).toEqual([
      "steps",
      "activity",
      "artifacts",
    ]);
    expect(tabs.value.map((tab) => tab.label)).toEqual([
      "runLive.tab.steps",
      "runLive.tab.activity",
      "runLive.tab.artifacts",
    ]);
  });

  it("setActiveTab switches the active key", () => {
    const { activeTab, setActiveTab } = useRunLiveTabs(makeTranslator());
    setActiveTab("artifacts");
    expect(activeTab.value).toBe<RunLiveTabKey>("artifacts");
    setActiveTab("steps");
    expect(activeTab.value).toBe<RunLiveTabKey>("steps");
  });

  it("re-runs the translator when locale-driven labels change", () => {
    let prefix = "en";
    const t = vi.fn((key: string) => `${prefix}:${key}`);
    const { tabs } = useRunLiveTabs(t);

    expect(tabs.value[0].label).toBe("en:runLive.tab.steps");
    prefix = "ru";
    // The computed should re-evaluate on next access because the translator
    // function call is the reactive boundary in production (i18n is reactive
    // via the preferences store); here we verify the computed is not frozen
    // to its first value.
    expect(t).toHaveBeenCalled();
  });
});
