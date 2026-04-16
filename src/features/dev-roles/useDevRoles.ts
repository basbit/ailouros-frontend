import { ref, reactive } from "vue";
import type { DevRoleSnap } from "@/shared/store/projects";
import { defaultEnvironmentForRole } from "@/shared/lib/use-swarm-defaults";
import { ensureModelChoicesForEnv } from "@/shared/lib/use-model-list";

export type { DevRoleSnap };

/** Per-role UI state for model selection (not persisted). */
export interface DevRoleUiState {
  modelChoices: [string, string][];
  modelFetchError: string | null;
}

export function useDevRoles(onChangeCb: () => void) {
  const devRoles = ref<DevRoleSnap[]>([]);
  /** Parallel array of UI state (model choices, errors) per dev role. */
  const uiStates = reactive<DevRoleUiState[]>([]);

  function _ensureUiState(idx: number): DevRoleUiState {
    while (uiStates.length <= idx) {
      uiStates.push({ modelChoices: [], modelFetchError: null });
    }
    return uiStates[idx];
  }

  async function fetchModels(idx: number): Promise<void> {
    const role = devRoles.value[idx];
    if (!role) return;
    const ui = _ensureUiState(idx);
    const env = role.environment;
    if (env === "cloud") {
      // Cloud models need profile — show Custom only
      ui.modelChoices = [["__custom__", "Custom…"]];
      ui.modelFetchError = null;
      return;
    }
    ui.modelFetchError = null;
    try {
      ui.modelChoices = await ensureModelChoicesForEnv(env);
    } catch (e) {
      ui.modelFetchError = e instanceof Error ? e.message : String(e);
      ui.modelChoices = [["__custom__", "Custom…"]];
    }
  }

  function add(prefill?: Partial<DevRoleSnap>): void {
    const idx = devRoles.value.length;
    devRoles.value.push({
      name: prefill?.name ?? "",
      environment: prefill?.environment ?? defaultEnvironmentForRole(),
      model: prefill?.model ?? "",
      prompt_path: prefill?.prompt_path ?? "",
      scope: prefill?.scope ?? "",
    });
    _ensureUiState(idx);
    void fetchModels(idx);
    onChangeCb();
  }

  function remove(idx: number): void {
    devRoles.value.splice(idx, 1);
    uiStates.splice(idx, 1);
    onChangeCb();
  }

  function update(idx: number, field: keyof DevRoleSnap, value: string): void {
    const r = devRoles.value[idx];
    if (r) (r as Record<string, string | undefined>)[field] = value;
    if (field === "environment") void fetchModels(idx);
    onChangeCb();
  }

  function applySnap(list: DevRoleSnap[]): void {
    devRoles.value = Array.isArray(list) ? list.map((r) => ({ ...r })) : [];
    uiStates.splice(0, uiStates.length);
    for (let i = 0; i < devRoles.value.length; i++) {
      _ensureUiState(i);
      void fetchModels(i);
    }
  }

  function collectSnap(): DevRoleSnap[] {
    return devRoles.value.filter((r) => r.name.trim());
  }

  function collectForApi(): DevRoleSnap[] {
    return devRoles.value
      .filter((r) => r.name.trim())
      .map((r) => {
        const e: DevRoleSnap = { name: r.name, environment: r.environment };
        if (r.model) e.model = r.model;
        if (r.prompt_path) e.prompt_path = r.prompt_path;
        if (r.scope) e.scope = r.scope;
        return e;
      });
  }

  return {
    devRoles,
    uiStates,
    add,
    remove,
    update,
    applySnap,
    collectSnap,
    collectForApi,
    fetchModels,
  };
}
