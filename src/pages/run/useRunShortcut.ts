import { onActivated, onDeactivated } from "vue";

/**
 * Cmd/Ctrl+Enter starts the run from anywhere on the idle page.
 *
 * Bound on activate rather than mount: the page lives inside <keep-alive>, so
 * a plain onMounted/onBeforeUnmount pair would leave the listener attached
 * while the user is on another route and fire a run they cannot see.
 */
export function useRunShortcut(startRun: () => void | Promise<void>): void {
  function handleRunShortcut(event: KeyboardEvent): void {
    const isMod = event.metaKey || event.ctrlKey;
    if (!isMod || event.key !== "Enter") return;
    event.preventDefault();
    void startRun();
  }

  onActivated(() => {
    window.addEventListener("keydown", handleRunShortcut);
  });

  onDeactivated(() => {
    window.removeEventListener("keydown", handleRunShortcut);
  });
}
