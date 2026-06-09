import { computed, ref } from "vue";

export type RunLiveTabKey = "steps" | "activity" | "artifacts";

type TranslatorArgs = Record<string, string | number | null | undefined>;

interface TranslatorLike {
  (key: string, args?: TranslatorArgs): string;
}

export interface RunLiveTab {
  key: RunLiveTabKey;
  label: string;
}

export function useRunLiveTabs(t: TranslatorLike) {
  const activeTab = ref<RunLiveTabKey>("steps");

  const tabs = computed<RunLiveTab[]>(() => [
    { key: "steps", label: t("runLive.tab.steps") },
    { key: "activity", label: t("runLive.tab.activity") },
    { key: "artifacts", label: t("runLive.tab.artifacts") },
  ]);

  function setActiveTab(key: RunLiveTabKey): void {
    activeTab.value = key;
  }

  return { activeTab, tabs, setActiveTab };
}
