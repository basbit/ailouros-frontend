import { describe, it, expect, vi } from "vitest";

import { useGraphsTab, type GraphsViewKey } from "./useGraphsTab";

function makeTranslator(): (key: string) => string {
  return vi.fn((key: string) => key);
}

describe("useGraphsTab", () => {
  it("defaults to the 'spec' (Спецификации) view", () => {
    const { activeView } = useGraphsTab(makeTranslator(), {
      loadCodeGraph: vi.fn(),
    });
    expect(activeView.value).toBe<GraphsViewKey>("spec");
  });

  it("exposes views in their expected order: spec, wiki, code", () => {
    const { views } = useGraphsTab(makeTranslator(), { loadCodeGraph: vi.fn() });
    expect(views.value.map((view) => view.key)).toEqual(["spec", "wiki", "code"]);
    expect(views.value.map((view) => view.label)).toEqual([
      "graphsTab.view.spec",
      "graphsTab.view.wiki",
      "graphsTab.view.code",
    ]);
  });

  it("setActiveView switches between views", () => {
    const { activeView, setActiveView } = useGraphsTab(makeTranslator(), {
      loadCodeGraph: vi.fn(),
    });
    setActiveView("wiki");
    expect(activeView.value).toBe<GraphsViewKey>("wiki");
    setActiveView("spec");
    expect(activeView.value).toBe<GraphsViewKey>("spec");
  });

  it("does not load the code graph until the code view is activated", () => {
    const loadCodeGraph = vi.fn();
    const { setActiveView } = useGraphsTab(makeTranslator(), { loadCodeGraph });
    setActiveView("wiki");
    setActiveView("spec");
    expect(loadCodeGraph).not.toHaveBeenCalled();
  });

  it("loads the code graph lazily exactly once on first 'code' activation", () => {
    const loadCodeGraph = vi.fn();
    const { setActiveView, codeGraphRequested } = useGraphsTab(makeTranslator(), {
      loadCodeGraph,
    });
    setActiveView("code");
    expect(loadCodeGraph).toHaveBeenCalledTimes(1);
    expect(codeGraphRequested.value).toBe(true);

    setActiveView("spec");
    setActiveView("code");
    expect(loadCodeGraph).toHaveBeenCalledTimes(1);
  });
});
