import { computed, ref } from "vue";

export type GraphsViewKey = "spec" | "wiki" | "code";

type TranslatorArgs = Record<string, string | number | null | undefined>;

interface TranslatorLike {
  (key: string, args?: TranslatorArgs): string;
}

export interface GraphsView {
  key: GraphsViewKey;
  label: string;
}

interface GraphsTabOptions {
  /** Invoked once, the first time the "code" view is activated (lazy load). */
  loadCodeGraph: () => void;
}

export function useGraphsTab(t: TranslatorLike, options: GraphsTabOptions) {
  const activeView = ref<GraphsViewKey>("spec");
  const codeGraphRequested = ref(false);

  const views = computed<GraphsView[]>(() => [
    { key: "spec", label: t("graphsTab.view.spec") },
    { key: "wiki", label: t("graphsTab.view.wiki") },
    { key: "code", label: t("graphsTab.view.code") },
  ]);

  function setActiveView(key: GraphsViewKey): void {
    activeView.value = key;
    if (key === "code" && !codeGraphRequested.value) {
      codeGraphRequested.value = true;
      options.loadCodeGraph();
    }
  }

  return { activeView, views, setActiveView, codeGraphRequested };
}
