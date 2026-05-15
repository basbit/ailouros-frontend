import { reactive, readonly } from "vue";

export interface HeartbeatLikeEvent {
  agent?: string;
  status?: string;
  message?: string;
  elapsed_sec?: number;
  next_check_in_sec?: number;
}

export interface HeartbeatRow {
  agent: string;
  message: string;
  elapsedSec: number | null;
  nextCheckInSec: number | null;
  startedAtMs: number;
}

export function useHeartbeatCollapser() {
  const active = reactive<Map<string, HeartbeatRow>>(new Map());

  function consume(event: HeartbeatLikeEvent): HeartbeatLikeEvent | null {
    const agent = (event.agent ?? "").trim();
    if (!agent) return event;
    if (event.status === "heartbeat") {
      const existing = active.get(agent);
      if (existing) {
        existing.elapsedSec = event.elapsed_sec ?? existing.elapsedSec;
        existing.nextCheckInSec = event.next_check_in_sec ?? existing.nextCheckInSec;
        existing.message = event.message ?? existing.message;
      } else {
        active.set(agent, {
          agent,
          message: event.message ?? `${agent}: still working`,
          elapsedSec: event.elapsed_sec ?? null,
          nextCheckInSec: event.next_check_in_sec ?? null,
          startedAtMs: Date.now(),
        });
      }
      return null;
    }
    if (active.has(agent)) {
      active.delete(agent);
    }
    return event;
  }

  function reset(): void {
    active.clear();
  }

  return {
    activeHeartbeats: readonly(active) as unknown as ReadonlyMap<string, HeartbeatRow>,
    consume,
    reset,
  };
}
