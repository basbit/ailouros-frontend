import { onMounted, onUnmounted } from "vue";

export interface HotReloadGateState {
  booting: boolean;
  running: boolean;
  /** A debounced settings save is queued → local state is dirty/unsaved. */
  pendingSave: boolean;
  /** The user is actively editing a form field right now. */
  editingField: boolean;
  documentHidden: boolean;
}

/**
 * Whether the periodic project-file hot-reload may run.
 *
 * It must NOT run while the user has unsaved edits (`pendingSave`) or is
 * actively typing in a field (`editingField`): reloading the persisted file
 * mid-edit calls `applySnap`, which replaces local state and drops the row the
 * user is editing (rows with an empty id are filtered out). That manifested as
 * "typing into an input deletes the whole row".
 */
export function shouldRunSettingsHotReload(state: HotReloadGateState): boolean {
  return (
    !state.booting &&
    !state.running &&
    !state.pendingSave &&
    !state.editingField &&
    !state.documentHidden
  );
}

export interface HotReloadOptions {
  intervalMs?: number;
  enabled?: () => boolean;
  fetcher: () => Promise<unknown>;
}

export function useSettingsHotReload(options: HotReloadOptions): {
  start: () => void;
  stop: () => void;
} {
  const intervalMs = Math.max(2000, options.intervalMs ?? 5000);
  let timer: ReturnType<typeof setInterval> | null = null;

  function tick(): void {
    if (options.enabled && !options.enabled()) return;
    void options.fetcher().catch(() => {
      /* swallow transient errors */
    });
  }

  function start(): void {
    if (timer !== null) return;
    timer = setInterval(tick, intervalMs);
  }

  function stop(): void {
    if (timer === null) return;
    clearInterval(timer);
    timer = null;
  }

  onMounted(start);
  onUnmounted(stop);

  return { start, stop };
}
