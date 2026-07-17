import { ROLES } from "@/shared/lib/pipeline-schema";
import type { RoleState } from "./useRoleState";

interface BulkRoleApplierDeps {
  roleStates: Record<string, RoleState>;
  modelApi: {
    loadModelChoices: (roleId: string, env: string) => Promise<[string, string][]>;
    applyModelChoices: (
      roleId: string,
      choices: [string, string][],
      wantModel?: string,
    ) => Promise<void>;
  };
  isBooting: { value: boolean };
  onChangeCb: () => void;
}

export function useBulkRoleApplier(deps: BulkRoleApplierDeps) {
  const { roleStates, modelApi, isBooting, onChangeCb } = deps;

  async function setAllRolesFromPicker(payload: {
    environment: string;
    remoteProfile?: string;
    model: string;
  }): Promise<void> {
    const env = payload.environment;
    const profile = (payload.remoteProfile ?? "").trim();
    const model = payload.model.trim();
    if (!env || !model) return;

    await Promise.all(
      ROLES.map((roleId) => applyBulkRole(roleId, env, profile, model)),
    );
    if (!isBooting.value) onChangeCb();
  }

  async function applyBulkRole(
    roleId: string,
    env: string,
    profile: string,
    model: string,
  ): Promise<void> {
    const roleState = roleStates[roleId];
    if (!roleState) return;
    roleState.environment = env;
    roleState.showProfileSelect = env === "cloud";
    roleState.remoteProfile = profile;
    roleState.modelMode = "manual";
    roleState.modelFetchError = null;
    try {
      const choices = await modelApi.loadModelChoices(roleId, env);
      await modelApi.applyModelChoices(roleId, choices, model);
    } catch (e) {
      roleState.modelFetchError = e instanceof Error ? e.message : String(e);
      roleState.modelChoices = [];
      roleState.modelSel = "__custom__";
      roleState.modelCustom = model;
    }
  }

  return {
    setAllRolesFromPicker,
  };
}
