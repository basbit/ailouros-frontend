import { useI18n } from "@/shared/lib/i18n";
import { defaultModelForRole } from "@/shared/lib/use-swarm-defaults";
import {
  ensureModelChoicesForEnv,
  fetchCloudModelsForProfile,
} from "@/shared/lib/use-model-list";
import type { RemoteProfileRow } from "@/entities/remote-profile";
import type { RoleState } from "./useRoleState";

export interface RoleModelSelectorDeps {
  profiles: { value: RemoteProfileRow[] };
  getRoleState: (roleId: string) => RoleState | undefined;
  effectiveModel: (roleId: string) => string;
}

export function useRoleModelSelector(deps: RoleModelSelectorDeps) {
  const { t } = useI18n();

  async function applyModelChoices(
    roleId: string,
    choices: [string, string][],
    wantModel?: string,
  ): Promise<void> {
    const roleState = deps.getRoleState(roleId);
    if (!roleState) return;
    roleState.modelChoices = choices;
    const want = wantModel ?? deps.effectiveModel(roleId);
    const hit = choices.find((choice) => choice[0] === want);
    if (hit) {
      roleState.modelSel = hit[0];
      roleState.modelCustom = "";
    } else if (want) {
      roleState.modelSel = "__custom__";
      roleState.modelCustom = want;
    } else {
      roleState.modelSel = choices[0]?.[0] ?? "";
      roleState.modelCustom = "";
    }
  }

  async function fetchCloudChoices(roleId: string): Promise<[string, string][]> {
    const roleState = deps.getRoleState(roleId);
    const row = deps.profiles.value.find(
      (profile) => profile.id === (roleState?.remoteProfile ?? ""),
    );
    if (!row) throw new Error(t("errors.selectCloudProfile"));
    return fetchCloudModelsForProfile(row);
  }

  async function loadModelChoices(
    roleId: string,
    env: string,
  ): Promise<[string, string][]> {
    if (env === "cloud") return fetchCloudChoices(roleId);
    return ensureModelChoicesForEnv(env);
  }

  function onModelSelect(roleId: string): void {
    const roleState = deps.getRoleState(roleId);
    if (!roleState) return;
    if (roleState.modelSel === "__custom__" && !roleState.modelCustom) {
      roleState.modelCustom = defaultModelForRole(roleId, roleState.environment);
    }
  }

  return {
    applyModelChoices,
    fetchCloudChoices,
    loadModelChoices,
    onModelSelect,
  };
}
