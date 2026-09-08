import { ref, reactive } from "vue";
import type { CrossValidatorSnap } from "@/entities/project";
import type { RemoteProfileRow } from "@/shared/model/project-types";
import { defaultEnvironmentForRole } from "@/shared/lib/use-swarm-defaults";
import {
  ensureModelChoicesForEnv,
  fetchCloudModelsForProfile,
} from "@/shared/lib/use-model-list";

export type { CrossValidatorSnap };

export interface CrossValidatorUiState {
  modelChoices: [string, string][];
  modelFetchError: string | null;
}

/** Shape sent as `agent_config.cross_validation`; mirrors cross_validate.py. */
export interface CrossValidationApiConfig {
  validators: Record<string, unknown>[];
}

function blankValidator(): CrossValidatorSnap {
  return {
    source: "role",
    role: "",
    environment: defaultEnvironmentForRole(),
    model: "",
    remote_profile: "",
    prompt: "",
    apply_edits: false,
  };
}

export function useCrossValidation(
  profiles: { value: RemoteProfileRow[] },
  onChangeCb: () => void,
) {
  const validators = ref<CrossValidatorSnap[]>([]);
  const uiStates = reactive<CrossValidatorUiState[]>([]);
  // Monotonic per-validator fetch epoch. A stale (older) in-flight response
  // must never overwrite a newer one, so each fetch bumps its own slot and the
  // awaited result is dropped unless its epoch still matches.
  const fetchEpoch = ref<number[]>([]);

  function _ensureUiState(idx: number): CrossValidatorUiState {
    while (uiStates.length <= idx) {
      uiStates.push({ modelChoices: [], modelFetchError: null });
    }
    return uiStates[idx];
  }

  function _epoch(idx: number): number {
    while (fetchEpoch.value.length <= idx) fetchEpoch.value.push(0);
    return fetchEpoch.value[idx];
  }

  async function fetchModels(idx: number): Promise<void> {
    const validator = validators.value[idx];
    if (!validator) return;
    const ui = _ensureUiState(idx);
    const epoch = _epoch(idx) + 1;
    fetchEpoch.value[idx] = epoch;
    ui.modelFetchError = null;
    if (validator.source === "role") {
      ui.modelChoices = [];
      return;
    }
    const profileId = validator.remote_profile.trim();
    if (validator.environment === "cloud" && !profileId) {
      // Without a profile there is no connection to list models from, and a
      // stale catalogue from another provider would be worse than none.
      ui.modelChoices = [];
      return;
    }
    try {
      const choices =
        validator.environment === "cloud"
          ? await fetchCloudModelsForProfile(resolveProfile(profileId))
          : await ensureModelChoicesForEnv(validator.environment);
      if (_epoch(idx) !== epoch) return; // a newer fetch superseded this one
      ui.modelChoices = choices;
    } catch (e) {
      if (_epoch(idx) !== epoch) return; // a newer fetch superseded this one
      ui.modelChoices = [];
      ui.modelFetchError = e instanceof Error ? e.message : String(e);
    }
  }

  function resolveProfile(profileId: string): RemoteProfileRow {
    const row = profiles.value.find((profile) => profile.id === profileId);
    if (!row) throw new Error(`Unknown cloud profile '${profileId}'`);
    return row;
  }

  function add(prefill?: Partial<CrossValidatorSnap>): void {
    const idx = validators.value.length;
    validators.value.push({ ...blankValidator(), ...prefill });
    _ensureUiState(idx);
    void fetchModels(idx);
    onChangeCb();
  }

  function remove(idx: number): void {
    validators.value.splice(idx, 1);
    uiStates.splice(idx, 1);
    onChangeCb();
  }

  function move(idx: number, delta: number): void {
    const target = idx + delta;
    if (target < 0 || target >= validators.value.length) return;
    const [row] = validators.value.splice(idx, 1);
    validators.value.splice(target, 0, row);
    const [ui] = uiStates.splice(idx, 1);
    uiStates.splice(target, 0, ui);
    onChangeCb();
  }

  function update(
    idx: number,
    field: keyof CrossValidatorSnap,
    value: string | boolean,
  ): void {
    const validator = validators.value[idx];
    if (!validator) return;
    (validator as Record<string, string | boolean>)[field] = value;
    if (field === "source" || field === "environment" || field === "remote_profile") {
      void fetchModels(idx);
    }
    onChangeCb();
  }

  function applySnap(list: CrossValidatorSnap[] | undefined): void {
    validators.value = Array.isArray(list)
      ? list.map((row) => ({ ...blankValidator(), ...row }))
      : [];
    uiStates.splice(0, uiStates.length);
    for (let i = 0; i < validators.value.length; i++) {
      _ensureUiState(i);
      void fetchModels(i);
    }
  }

  /** Rows that name a model the backend can actually resolve. A row that
   * names neither a role nor a model would be skipped by cross_validate.py
   * anyway, so it is dropped here rather than sent as a silent no-op. */
  function usableValidators(): CrossValidatorSnap[] {
    return validators.value.filter((row) =>
      row.source === "role" ? !!row.role.trim() : !!row.model.trim(),
    );
  }

  function collectSnap(): CrossValidatorSnap[] {
    return validators.value.map((row) => ({ ...row }));
  }

  /** `null` when nothing usable is configured, so buildAgentConfig omits the
   * key entirely and the scenario's own validator defaults still apply. */
  function collectForApi(): CrossValidationApiConfig | null {
    const rows = usableValidators();
    if (!rows.length) return null;
    return {
      validators: rows.map((row) => {
        const entry: Record<string, unknown> = {};
        if (row.source === "role") {
          entry.model_from_role = row.role.trim();
        } else {
          entry.model = row.model.trim();
          entry.environment = row.environment;
          const profileId = row.remote_profile.trim();
          if (profileId) entry.remote_profile = profileId;
        }
        const prompt = row.prompt.trim();
        if (prompt) entry.prompt = prompt;
        if (row.apply_edits) entry.apply_edits = true;
        return entry;
      }),
    };
  }

  return {
    validators,
    uiStates,
    add,
    remove,
    move,
    update,
    applySnap,
    collectSnap,
    collectForApi,
    usableValidators,
    fetchModels,
  };
}
