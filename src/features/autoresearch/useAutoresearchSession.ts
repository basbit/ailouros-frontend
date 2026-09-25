import { onBeforeUnmount, ref, shallowRef } from "vue";
import {
  applyResearchSession,
  cancelResearchSession,
  discardResearchSession,
  getResearchSession,
  openResearchPullRequest,
  type ResearchSession,
} from "@/shared/api/endpoints/autoresearch";
import { isSessionActive } from "./model/format";

export const POLL_INTERVAL_MS = 2000;

export type SessionAction = "cancel" | "pullRequest" | "apply" | "discard";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useAutoresearchSession() {
  const session = shallowRef<ResearchSession | null>(null);
  const loadError = ref("");
  const actionError = ref("");
  const busyAction = ref<SessionAction | null>(null);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let currentId = "";
  // Every request takes a ticket; a response older than the last one applied
  // (e.g. a poll that was in flight when Cancel answered) is dropped.
  let issuedTicket = 0;
  let appliedTicket = 0;

  function takeTicket(): number {
    issuedTicket += 1;
    return issuedTicket;
  }

  function isStale(ticket: number, requestedId: string): boolean {
    return requestedId !== currentId || ticket < appliedTicket;
  }

  function applySession(ticket: number, loaded: ResearchSession): void {
    appliedTicket = ticket;
    session.value = loaded;
  }

  function stopPolling(): void {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function scheduleNextPoll(): void {
    stopPolling();
    if (session.value && isSessionActive(session.value.status)) {
      timer = setTimeout(() => void refresh(), POLL_INTERVAL_MS);
    }
  }

  async function refresh(): Promise<void> {
    const requestedId = currentId;
    if (!requestedId) return;
    const ticket = takeTicket();
    try {
      const loaded = await getResearchSession(requestedId);
      if (isStale(ticket, requestedId)) return;
      applySession(ticket, loaded);
      loadError.value = "";
    } catch (error: unknown) {
      if (isStale(ticket, requestedId)) return;
      loadError.value = messageOf(error);
    }
    scheduleNextPoll();
  }

  async function open(sessionId: string): Promise<void> {
    stopPolling();
    currentId = sessionId;
    session.value = null;
    actionError.value = "";
    await refresh();
  }

  function close(): void {
    stopPolling();
    currentId = "";
    session.value = null;
  }

  const actions: Record<SessionAction, (id: string) => Promise<ResearchSession>> = {
    cancel: cancelResearchSession,
    pullRequest: (id) => openResearchPullRequest(id),
    apply: applyResearchSession,
    discard: discardResearchSession,
  };

  async function run(action: SessionAction): Promise<boolean> {
    const requestedId = currentId;
    if (!requestedId || busyAction.value) return false;
    busyAction.value = action;
    actionError.value = "";
    const ticket = takeTicket();
    try {
      const updated = await actions[action](requestedId);
      if (isStale(ticket, requestedId)) return true;
      applySession(ticket, updated);
      scheduleNextPoll();
      return true;
    } catch (error: unknown) {
      actionError.value = messageOf(error);
      return false;
    } finally {
      busyAction.value = null;
    }
  }

  onBeforeUnmount(stopPolling);

  return { session, loadError, actionError, busyAction, open, close, refresh, run };
}
