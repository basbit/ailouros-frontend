import { computed, ref, watch, type Ref } from "vue";

export type HistoryTabKey =
  | "run"
  | "overview"
  | "steps"
  | "logs"
  | "artifacts"
  | "activity"
  | "conversation"
  | "spec"
  | "graph";

type TranslatorArgs = Record<string, string | number | null | undefined>;

interface TranslatorLike {
  (key: string, args?: TranslatorArgs): string;
}

export function useHistoryDetailTabs(
  t: TranslatorLike,
  workspaceRootForRun: Ref<string>,
) {
  const activeTab = ref<HistoryTabKey>("run");
  const selectedSpecId = ref<string>("");
  const specEditing = ref(false);

  const tabs = computed<Array<{ key: HistoryTabKey; label: string }>>(() => [
    { key: "run", label: t("history.detail.tab.run") },
    { key: "overview", label: t("history.detail.tab.overview") },
    { key: "steps", label: t("history.detail.tab.steps") },
    { key: "logs", label: t("history.detail.tab.logs") },
    { key: "artifacts", label: t("history.detail.tab.artifacts") },
    { key: "activity", label: t("history.detail.tab.activity") },
    { key: "conversation", label: t("history.detail.tab.conversation") },
    { key: "spec", label: t("history.detail.tab.spec") },
    { key: "graph", label: t("history.detail.tab.graph") },
  ]);

  function onSpecNodeClick(nodeId: string): void {
    selectedSpecId.value = nodeId;
    specEditing.value = false;
  }

  watch(workspaceRootForRun, () => {
    selectedSpecId.value = "";
    specEditing.value = false;
  });

  return {
    activeTab,
    tabs,
    selectedSpecId,
    specEditing,
    onSpecNodeClick,
  };
}
