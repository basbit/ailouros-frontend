import { computed, ref, watch, type ComputedRef, type Ref } from "vue";

const FINISHED_STATUSES = new Set([
  "completed",
  "completed_no_writes",
  "failed",
  "cancelled",
  "awaiting_human",
]);

interface PanelInputs<T> {
  taskId: Ref<string | null> | ComputedRef<string | null>;
  scenarioId: Ref<string | null> | ComputedRef<string | null>;
  taskStatus: Ref<string | null> | ComputedRef<string | null>;
  fetcher: (taskId: string) => Promise<T>;
}

interface PanelState<T> {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  visible: ComputedRef<boolean>;
}

export function useScenarioFinishedReload<T>(inputs: PanelInputs<T>): PanelState<T> {
  const data = ref<T | null>(null) as Ref<T | null>;
  const loading = ref(false);
  const error = ref<string | null>(null);
  let lastFetchedTaskId: string | null = null;

  const visible = computed(() =>
    Boolean(inputs.taskId.value && inputs.scenarioId.value),
  );

  async function reload(taskId: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      data.value = await inputs.fetcher(taskId);
      lastFetchedTaskId = taskId;
    } catch (err) {
      data.value = null;
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      loading.value = false;
    }
  }

  watch(
    () => [inputs.taskId.value, inputs.taskStatus.value] as const,
    ([taskId, status]) => {
      if (!taskId) {
        data.value = null;
        error.value = null;
        lastFetchedTaskId = null;
        return;
      }
      if (!inputs.scenarioId.value) return;
      const isFinished = FINISHED_STATUSES.has(String(status ?? ""));
      if (!isFinished) return;
      if (taskId === lastFetchedTaskId) return;
      void reload(taskId);
    },
    { immediate: true },
  );

  return { data, loading, error, visible };
}
