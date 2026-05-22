import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUiStore } from "@/shared/store/ui";

type TranslatorArgs = Record<string, string | number | null | undefined>;

interface TranslatorLike {
  (key: string, args?: TranslatorArgs): string;
}

export type TopTabKey = "run" | "configure" | "history" | "settings";

export interface TopTabEntry {
  key: TopTabKey;
  label: string;
  target: string;
}

const ACTIVE_RUN_STATUSES = new Set<string>([
  "running",
  "in_progress",
  "awaiting_human",
  "awaiting_shell_confirm",
  "awaiting_manual_shell",
  "blocked",
]);

export function useAppHeaderTabs(t: TranslatorLike) {
  const router = useRouter();
  const route = useRoute();
  const ui = useUiStore();

  const topTabs = computed<TopTabEntry[]>(() => {
    const status = (ui.taskStatus ?? "").toString();
    const hasActiveRun = !!ui.taskId && ACTIVE_RUN_STATUSES.has(status);
    const runTarget = hasActiveRun ? "/run/active" : "/run";
    return [
      { key: "run", label: t("header.tabs.run"), target: runTarget },
      { key: "configure", label: t("header.tabs.configure"), target: "/configure" },
      { key: "history", label: t("header.tabs.history"), target: "/history" },
      {
        key: "settings",
        label: t("header.tabs.settings"),
        target: "/settings/profile",
      },
    ];
  });

  const activeTopTab = computed<TopTabKey | null>(() => {
    const path = route.path;
    if (path.startsWith("/run")) return "run";
    if (path.startsWith("/configure")) return "configure";
    if (path.startsWith("/history")) return "history";
    if (path.startsWith("/settings")) return "settings";
    return null;
  });

  function navigateToTab(target: string): void {
    void router.push(target);
  }

  return { topTabs, activeTopTab, navigateToTab };
}
