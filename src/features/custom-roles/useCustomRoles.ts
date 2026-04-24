import { ref, reactive } from "vue";
import type { CustomRoleSnap } from "@/shared/store/projects";
import { defaultEnvironmentForRole } from "@/shared/lib/use-swarm-defaults";
import { ensureModelChoicesForEnv } from "@/shared/lib/use-model-list";

export type { CustomRoleSnap };

/** Per-role UI state for model selection (not persisted). */
export interface CustomRoleUiState {
  modelChoices: [string, string][];
  modelFetchError: string | null;
}

export function useCustomRoles(onChangeCb: () => void) {
  const customRoles = ref<CustomRoleSnap[]>([]);
  const uiStates = reactive<CustomRoleUiState[]>([]);

  function _ensureUiState(idx: number): CustomRoleUiState {
    while (uiStates.length <= idx) {
      uiStates.push({ modelChoices: [], modelFetchError: null });
    }
    return uiStates[idx];
  }

  async function fetchModels(idx: number): Promise<void> {
    const role = customRoles.value[idx];
    if (!role) return;
    const ui = _ensureUiState(idx);
    const env = role.environment;
    if (env === "cloud") {
      ui.modelChoices = [];
      ui.modelFetchError = null;
      return;
    }
    ui.modelFetchError = null;
    try {
      ui.modelChoices = await ensureModelChoicesForEnv(env);
    } catch (e) {
      ui.modelFetchError = e instanceof Error ? e.message : String(e);
      ui.modelChoices = [];
    }
  }

  function add(prefill?: Partial<CustomRoleSnap>): void {
    const idx = customRoles.value.length;
    customRoles.value.push({
      id: prefill?.id ?? "",
      label: prefill?.label ?? "",
      environment: prefill?.environment ?? defaultEnvironmentForRole(),
      model: prefill?.model ?? "",
      prompt_path: prefill?.prompt_path ?? "",
      prompt_text: prefill?.prompt_text ?? "",
      skill_ids: prefill?.skill_ids ?? "",
    });
    _ensureUiState(idx);
    void fetchModels(idx);
    onChangeCb();
  }

  function remove(idx: number): void {
    customRoles.value.splice(idx, 1);
    uiStates.splice(idx, 1);
    onChangeCb();
  }

  function update(idx: number, field: keyof CustomRoleSnap, value: string): void {
    const r = customRoles.value[idx];
    if (r) (r as Record<string, string>)[field] = value;
    if (field === "environment") void fetchModels(idx);
    onChangeCb();
  }

  function applySnap(list: CustomRoleSnap[]): void {
    customRoles.value = Array.isArray(list) ? list.map((r) => ({ ...r })) : [];
    uiStates.splice(0, uiStates.length);
    for (let i = 0; i < customRoles.value.length; i++) {
      _ensureUiState(i);
      void fetchModels(i);
    }
  }

  function collectSnap(): CustomRoleSnap[] {
    return customRoles.value
      .map((r) => ({
        ...r,
        id: r.id
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_")
          .replace(/^_+|_+$/, ""),
      }))
      .filter((r) => r.id);
  }

  return {
    customRoles,
    uiStates,
    add,
    remove,
    update,
    applySnap,
    collectSnap,
    fetchModels,
  };
}
