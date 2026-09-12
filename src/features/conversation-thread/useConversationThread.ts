import { computed, ref, watch } from "vue";
import {
  appendConversationTurn,
  createConversationThread,
  deleteConversationThread,
  getConversationThread,
  listConversationThreads,
  updateConversationTurn,
  type ConversationThreadDto,
  type ConversationThreadSummaryDto,
  type ConversationTurnDto,
} from "@/shared/api/endpoints/conversation";
import { useProjectsStore } from "@/entities/project";

const threadsList = ref<ConversationThreadSummaryDto[]>([]);
const activeThread = ref<ConversationThreadDto | null>(null);
const loadingThreads = ref(false);
const loadingActiveThread = ref(false);
const threadError = ref<string | null>(null);

export function useConversationThread() {
  const projects = useProjectsStore();

  const currentProjectId = computed(() => projects.currentId);

  async function loadThreads(): Promise<void> {
    loadingThreads.value = true;
    threadError.value = null;
    try {
      const res = await listConversationThreads(currentProjectId.value);
      threadsList.value = res.threads ?? [];
    } catch (err) {
      threadError.value = err instanceof Error ? err.message : String(err);
      threadsList.value = [];
    } finally {
      loadingThreads.value = false;
    }
  }

  async function selectThread(threadId: string): Promise<void> {
    if (!threadId) return;
    loadingActiveThread.value = true;
    threadError.value = null;
    try {
      const res = await getConversationThread(threadId);
      activeThread.value = res.thread;
    } catch (err) {
      threadError.value = err instanceof Error ? err.message : String(err);
      activeThread.value = null;
    } finally {
      loadingActiveThread.value = false;
    }
  }

  async function startNewThread(
    title = "New Conversation",
  ): Promise<ConversationThreadDto> {
    threadError.value = null;
    const res = await createConversationThread({
      title,
      project_id: currentProjectId.value,
    });
    activeThread.value = res.thread;
    void loadThreads();
    return res.thread;
  }

  async function removeThread(threadId: string): Promise<void> {
    try {
      await deleteConversationThread(threadId);
      if (activeThread.value?.id === threadId) {
        activeThread.value = null;
      }
      void loadThreads();
    } catch (err) {
      threadError.value = err instanceof Error ? err.message : String(err);
    }
  }

  async function addTurn(
    userMessage: string,
    attachments?: Array<{ name: string; content?: string }>,
    imageAttachments?: Array<{ name: string; path: string }>,
    taskId?: string | null,
  ): Promise<{ thread: ConversationThreadDto; turn: ConversationTurnDto }> {
    let thread = activeThread.value;
    if (!thread) {
      thread = await startNewThread(userMessage.slice(0, 40) || "New Conversation");
    }
    const res = await appendConversationTurn(thread.id, {
      user_message: userMessage,
      attachments,
      image_attachments: imageAttachments,
      task_id: taskId,
      status: "running",
    });
    activeThread.value = res.thread;
    void loadThreads();
    return res;
  }

  async function patchTurn(
    turnId: string,
    updates: {
      status?:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "blocked"
        | "awaiting_human";
      task_id?: string | null;
      assistant_message?: string;
      orchestrator_decision?: Record<string, unknown> | null;
      gate?: Record<string, unknown> | null;
      artifacts?: string[];
      append_progress?: Record<string, unknown>;
    },
  ): Promise<void> {
    const thread = activeThread.value;
    if (!thread) return;
    try {
      const res = await updateConversationTurn(thread.id, turnId, updates);
      // Update local state turn
      const existing = thread.turns.find((t) => t.id === turnId);
      if (existing) {
        Object.assign(existing, res.turn);
      }
    } catch (err) {
      console.warn("patchTurn error:", err);
    }
  }

  watch(
    () => projects.currentId,
    () => {
      void loadThreads();
    },
    { immediate: true },
  );

  return {
    threadsList,
    activeThread,
    loadingThreads,
    loadingActiveThread,
    threadError,
    loadThreads,
    selectThread,
    startNewThread,
    removeThread,
    addTurn,
    patchTurn,
  };
}
