import type { ConversationTurnDto } from "@/shared/api/endpoints/conversation";
import { isAuthenticationFailure } from "@/shared/lib/auth-failure";

type TurnPatchStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "blocked"
  | "awaiting_human";

export interface TurnStatusUpdate {
  status: TurnPatchStatus;
  assistantMessage: string;
  /** Whether the chat should scroll to the freshly patched bubble. */
  scroll: boolean;
}

interface ResolveTurnStatusUpdateOptions {
  taskStatus: string | null;
  turnStatus: string | null;
  blockedReason: string | null;
  taskError: unknown;
  /** The orchestrator's account of the run; the status strings are the fallback. */
  runSummary?: string;
  copy: {
    doneOk: string;
    doneWithFailures: string;
    awaitingHuman: string;
    failed: string;
    authFailed?: string;
    blockedBubble: (reason: string) => string;
    blockedTitle: string;
  };
}

const COMPLETED_STATUSES = new Set([
  "completed",
  "completed_no_writes",
  "completed_with_failures",
]);
const RUNNING_STATUSES = new Set(["running", "in_progress"]);

/**
 * Maps a live pipeline status onto the chat turn it belongs to. Pure: callers
 * (the ChatPage watcher) only PATCH when this returns a non-null update and
 * the turn is not already in that state — the WS ticks repeat every second,
 * so unguarded PATCHes would spam the conversation API.
 */
export function resolveTurnStatusUpdate(
  options: ResolveTurnStatusUpdateOptions,
): TurnStatusUpdate | null {
  const { taskStatus, turnStatus, blockedReason, taskError, copy } = options;
  const runSummary = (options.runSummary || "").trim();
  if (!taskStatus) return null;

  if (COMPLETED_STATUSES.has(taskStatus)) {
    return {
      status: "completed",
      assistantMessage:
        runSummary ||
        (taskStatus === "completed_with_failures" ? copy.doneWithFailures : copy.doneOk),
      scroll: true,
    };
  }

  if (taskStatus === "awaiting_human") {
    if (turnStatus === "awaiting_human") return null;
    return {
      status: "awaiting_human",
      assistantMessage: copy.awaitingHuman,
      scroll: true,
    };
  }

  if (taskStatus === "blocked") {
    if (turnStatus === "blocked") return null;
    // The reason is only templated when present; the generic title is used
    // as-is so it is never wrapped inside its own template.
    return {
      status: "blocked",
      assistantMessage: blockedReason
        ? copy.blockedBubble(blockedReason)
        : copy.blockedTitle,
      scroll: true,
    };
  }

  if (RUNNING_STATUSES.has(taskStatus)) {
    if (turnStatus !== "awaiting_human" && turnStatus !== "blocked") return null;
    return {
      status: "running",
      assistantMessage: "",
      scroll: false,
    };
  }

  if (taskStatus === "failed" || taskStatus === "cancelled") {
    return failedTurnUpdate(taskError, copy);
  }

  return null;
}

function failedTurnUpdate(
  taskError: ResolveTurnStatusUpdateOptions["taskError"],
  copy: ResolveTurnStatusUpdateOptions["copy"],
): TurnStatusUpdate {
  if (isAuthenticationFailure(taskError)) {
    return {
      status: "failed",
      assistantMessage: copy.authFailed
        ? `${copy.authFailed}\n\n${taskError}`
        : String(taskError),
      scroll: true,
    };
  }
  return {
    status: "failed",
    assistantMessage: String(taskError || copy.failed),
    scroll: true,
  };
}

export function findActiveTurn(
  turns: ConversationTurnDto[] | undefined,
  turnId: string | null,
): ConversationTurnDto | null {
  if (!turnId) return null;
  return turns?.find((turn) => turn.id === turnId) ?? null;
}
