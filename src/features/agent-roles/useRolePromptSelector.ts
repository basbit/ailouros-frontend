import {
  defaultPromptPathForRole,
  promptChoicesForRole,
} from "@/shared/lib/use-swarm-defaults";
import type { RoleState } from "./useRoleState";

export interface RolePromptSelectorDeps {
  getRoleState: (roleId: string) => RoleState | undefined;
}

export function useRolePromptSelector(deps: RolePromptSelectorDeps) {
  function refreshPromptChoices(roleId: string): void {
    const roleState = deps.getRoleState(roleId);
    if (!roleState) return;
    roleState.promptChoices = promptChoicesForRole(roleId);
  }

  function resetPromptToDefault(roleId: string): void {
    const roleState = deps.getRoleState(roleId);
    if (!roleState) return;
    roleState.promptChoices = promptChoicesForRole(roleId);
    roleState.promptSel = defaultPromptPathForRole(roleId);
    roleState.promptCustom = "";
  }

  function applyPromptPath(roleId: string, wantPrompt: string): void {
    const roleState = deps.getRoleState(roleId);
    if (!roleState) return;
    roleState.promptChoices = promptChoicesForRole(roleId);
    const hit = roleState.promptChoices.find((choice) => choice[0] === wantPrompt);
    if (hit) {
      roleState.promptSel = hit[0];
      roleState.promptCustom = "";
    } else {
      roleState.promptSel = "__custom__";
      roleState.promptCustom = wantPrompt;
    }
  }

  function onPromptSelect(roleId: string): void {
    const roleState = deps.getRoleState(roleId);
    if (!roleState) return;
    if (roleState.promptSel === "__custom__" && !roleState.promptCustom) {
      roleState.promptCustom = defaultPromptPathForRole(roleId);
    }
  }

  return {
    refreshPromptChoices,
    resetPromptToDefault,
    applyPromptPath,
    onPromptSelect,
  };
}
