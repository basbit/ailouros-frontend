import { onScopeDispose, ref, type Ref } from "vue";
import { ApiError } from "@/shared/api/http";
import {
  getHealth,
  type HealthStatus,
  type SubsystemHealth,
  type SystemHealth,
} from "@/shared/api/endpoints/health";

export interface UseSystemHealthState {
  status: Ref<HealthStatus | null>;
  subsystems: Ref<SubsystemHealth[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  notImplemented: Ref<boolean>;
  lastUpdatedAt: Ref<number | null>;
  reload: () => Promise<void>;
  reset: () => void;
  stopPolling: () => void;
}

const DEFAULT_INTERVAL_MS = 30_000;

function emptyState(): SystemHealth {
  return { status: "ok", subsystems: [] };
}

export function useSystemHealth(
  intervalMs: number = DEFAULT_INTERVAL_MS,
): UseSystemHealthState {
  const status = ref<HealthStatus | null>(null);
  const subsystems = ref<SubsystemHealth[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const notImplemented = ref(false);
  const lastUpdatedAt = ref<number | null>(null);

  let timer: ReturnType<typeof setInterval> | null = null;

  async function reload(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const payload = await getHealth();
      const merged: SystemHealth = {
        status: payload.status ?? "ok",
        subsystems: Array.isArray(payload.subsystems) ? payload.subsystems : [],
      };
      status.value = merged.status;
      subsystems.value = merged.subsystems;
      notImplemented.value = false;
      lastUpdatedAt.value = Date.now();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        notImplemented.value = true;
        status.value = null;
        subsystems.value = [];
        return;
      }
      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = "Failed to load health.";
      }
    } finally {
      loading.value = false;
    }
  }

  function stopPolling(): void {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function reset(): void {
    stopPolling();
    const fresh = emptyState();
    status.value = null;
    subsystems.value = fresh.subsystems;
    loading.value = false;
    error.value = null;
    notImplemented.value = false;
    lastUpdatedAt.value = null;
  }

  if (intervalMs > 0) {
    timer = setInterval(() => {
      void reload();
    }, intervalMs);
    onScopeDispose(() => stopPolling());
  }

  return {
    status,
    subsystems,
    loading,
    error,
    notImplemented,
    lastUpdatedAt,
    reload,
    reset,
    stopPolling,
  };
}
