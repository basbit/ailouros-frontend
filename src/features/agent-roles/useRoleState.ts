import { reactive } from "vue";
import { ROLES } from "@/shared/lib/pipeline-schema";
import { onRolesCatalogUpdate } from "@/shared/api/endpoints/rolesCatalog";
import {
  defaultEnvironmentForRole,
  defaultPromptPathForRole,
  promptChoicesForRole,
} from "@/shared/lib/use-swarm-defaults";

export interface RoleState {
  environment: string;
  modelChoices: [string, string][];
  modelSel: string;
  modelCustom: string;
  promptChoices: [string, string][];
  promptSel: string;
  promptCustom: string;
  promptText: string;
  skillIds: string;
  remoteProfile: string;
  showProfileSelect: boolean;
  modelFetchError: string | null;
}

function createInitialRoleState(roleId: string): RoleState {
  return {
    environment: defaultEnvironmentForRole(),
    modelChoices: [] as [string, string][],
    modelSel: "",
    modelCustom: "",
    promptChoices: promptChoicesForRole(roleId),
    promptSel: defaultPromptPathForRole(roleId),
    promptCustom: "",
    promptText: "",
    skillIds: "",
    remoteProfile: "",
    showProfileSelect: false,
    modelFetchError: null,
  };
}

export function useRoleState() {
  const roleStates = reactive<Record<string, RoleState>>(
    Object.fromEntries(ROLES.map((roleId) => [roleId, createInitialRoleState(roleId)])),
  );

  onRolesCatalogUpdate((catalog) => {
    for (const role of catalog.roles) {
      if (!roleStates[role.id]) {
        roleStates[role.id] = createInitialRoleState(role.id);
      }
    }
  });

  function getRoleState(roleId: string): RoleState | undefined {
    return roleStates[roleId];
  }

  function effectiveModel(roleId: string): string {
    const roleState = roleStates[roleId];
    if (!roleState) return "";
    return roleState.modelSel === "__custom__"
      ? roleState.modelCustom
      : roleState.modelSel;
  }

  function effectivePromptPath(roleId: string): string {
    const roleState = roleStates[roleId];
    if (!roleState) return "";
    return roleState.promptSel === "__custom__"
      ? roleState.promptCustom
      : roleState.promptSel;
  }

  return {
    roleStates,
    getRoleState,
    effectiveModel,
    effectivePromptPath,
  };
}
