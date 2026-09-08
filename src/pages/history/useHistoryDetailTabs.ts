import { computed, ref } from "vue";

export type HistoryTabKey =
  | "run"
  | "activity"
  | "artifacts"
  | "tokens"
  | "graphs"
  | "visual"
  | "trace";

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
    { key: "visual", label: t("history.detail.tab.visual") },
    { key: "trace", label: t("history.detail.tab.trace") },
  ]);

  return {
    activeTab,
    tabs,
  };
}
