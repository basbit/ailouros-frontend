import type { useUiStore } from "@/shared/store/ui";

type UiStore = ReturnType<typeof useUiStore>;

/**
 * Single definition of "this session needs the operator". The header badge and
 * the alert composable both render from it, so they cannot drift apart.
 */
export function isAttentionRequiredIn(ui: UiStore): boolean {
  if (
    ui.humanGateVisible ||
    ui.shellGateVisible ||
    ui.manualShellGateVisible ||
    ui.retryGateVisible
  ) {
    return true;
  }
  if (ui.taskStatus === "awaiting_human") return true;
  return findBackgroundTaskAwaitingHuman(ui) !== null;
}

export function findBackgroundTaskAwaitingHuman(ui: UiStore): string | null {
  const entry = ui.historyList.find(
    (item) =>
      item.status === "awaiting_human" &&
      Boolean(item.taskId) &&
      (ui.activeRunIds ?? []).includes(item.taskId as string),
  );
  return entry?.taskId ?? null;
}
