import { defineStore } from "pinia";
import { ref } from "vue";
import type {
  TaskStatus,
  TaskHistoryEntry,
  TaskSnapshot,
} from "@/shared/model/task-types";

export interface TaskEvent {
  agent?: string;
  message?: string;
  ts?: number;
}

export interface TaskState {
  taskId: string | null;
  status: TaskStatus | null;
  error: unknown;
  history: TaskHistoryEntry[];
  agents: string[];
  /** All events, newest first, kept for UI consumers that need a short timeline. */
  lastEvents: TaskEvent[];
}

export const useTaskStore = defineStore("task", () => {
  const taskId = ref<string | null>(null);
  const status = ref<TaskStatus | null>(null);
  const error = ref<unknown>(null);
  const history = ref<TaskHistoryEntry[]>([]);
  const agents = ref<string[]>([]);
  const lastEvents = ref<TaskEvent[]>([]);

  /** Apply a full snapshot from the WS tick or HTTP polling. */
  function setTask(snapshot: TaskSnapshot & { task_id?: string }): void {
    if (snapshot.task_id !== undefined) {
      taskId.value = snapshot.task_id;
    }
    if (snapshot.status !== undefined) {
      status.value = snapshot.status;
    }
    error.value = snapshot.error ?? null;
    if (Array.isArray(snapshot.history)) {
      history.value = snapshot.history;
      lastEvents.value = [...snapshot.history].reverse();
    }
    if (Array.isArray(snapshot.agents)) {
      agents.value = snapshot.agents;
    }
  }

  /** Overwrite only the taskId (used when the user starts a new run). */
  function setTaskId(id: string): void {
    taskId.value = id;
  }

  /** Reset all task state back to idle. */
  function resetTask(): void {
    taskId.value = null;
    status.value = null;
    error.value = null;
    history.value = [];
    agents.value = [];
    lastEvents.value = [];
  }

  return {
    taskId,
    status,
    error,
    history,
    agents,
    lastEvents,
    setTask,
    setTaskId,
    resetTask,
  };
});
