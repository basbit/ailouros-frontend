import { onMounted, onUnmounted } from "vue";

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
