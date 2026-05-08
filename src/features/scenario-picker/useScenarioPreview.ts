import { ref, watch } from "vue";
import type { Ref } from "vue";
import { previewScenario } from "@/shared/api/endpoints/scenarios";
import type {
  ScenarioPreview,
  ScenarioPreviewOverrides,
} from "@/shared/model/scenario-types";

export interface ScenarioPreviewApi {
  preview: Ref<ScenarioPreview | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
}

export function useScenarioPreview(
  scenarioId: Ref<string | null>,
  overrides?: Ref<ScenarioPreviewOverrides>,
  debounceMs = 250,
): ScenarioPreviewApi {
  const preview = ref<ScenarioPreview | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let token = 0;

  async function load(id: string, ov: ScenarioPreviewOverrides): Promise<void> {
    const myToken = ++token;
    loading.value = true;
    error.value = null;
    try {
      const result = await previewScenario(id, ov);
      if (myToken !== token) return;
      preview.value = result;
    } catch (err) {
      if (myToken !== token) return;
      preview.value = null;
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      if (myToken === token) loading.value = false;
    }
  }

  function schedule(): void {
    if (timer !== null) clearTimeout(timer);
    const id = scenarioId.value;
    if (!id) {
      token++;
      preview.value = null;
      error.value = null;
      loading.value = false;
      return;
    }
    const ov = overrides ? overrides.value : {};
    timer = setTimeout(() => {
      timer = null;
      void load(id, ov);
    }, debounceMs);
  }

  watch(
    () => [scenarioId.value, overrides?.value] as const,
    () => schedule(),
    { immediate: true, deep: true },
  );

  return { preview, loading, error };
}
