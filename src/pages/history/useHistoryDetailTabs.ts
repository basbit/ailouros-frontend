import { computed, ref } from "vue";

export type HistoryTabKey = "run" | "activity" | "artifacts" | "tokens" | "graphs";

type TranslatorArgs = Record<string, string | number | null | undefined>;

interface TranslatorLike {
  (key: string, args?: TranslatorArgs): string;
}

export function useHistoryDetailTabs(t: TranslatorLike) {
  const activeTab = ref<HistoryTabKey>("run");

  const tabs = computed<Array<{ key: HistoryTabKey; label: string }>>(() => [
    { key: "run", label: t("history.detail.tab.run") },
    { key: "activity", label: t("history.detail.tab.activity") },
    { key: "artifacts", label: t("history.detail.tab.artifacts") },
    { key: "tokens", label: t("history.detail.tab.tokens") },
    { key: "graphs", label: t("history.detail.tab.graphs") },
  ]);

  return {
    activeTab,
    tabs,
  };
}
