/**
 * useRoleHandlers — role-state mutation glue extracted from `SwarmUiPage`.
 * One-liners are deliberately kept so the page becomes pure markup.
 */

import { useUiStore } from "@/shared/store/ui";
import { useI18n } from "@/shared/lib/i18n";
import type { useSettings } from "@/widgets/settings/useSettings";
import type { RoleSnapshot } from "@/shared/store/projects";
import type { ModelAssignment } from "@/shared/model/onboarding-types";

type SettingsApi = ReturnType<typeof useSettings>;

export interface RoleHandlers {
  onRoleEnvChange: (roleId: string, env: string) => Promise<void>;
  onRoleProfileChange: (roleId: string, profile: string) => Promise<void>;
  onRoleModelSelChange: (roleId: string, val: string) => void;
  onRoleModelCustomInput: (roleId: string, val: string) => void;
  onRolePromptSelChange: (roleId: string, val: string) => void;
  onRolePromptCustomInput: (roleId: string, val: string) => void;
  onRoleSkillIdsInput: (roleId: string, val: string) => void;
  onSwarmFormUpdate: (field: string, value: string) => void;
  onAutoAssignModels: () => Promise<void>;
  onOnboardingModelAssignments: (assignments: ModelAssignment[]) => void;
}

export function useRoleHandlers(settings: SettingsApi): RoleHandlers {
  const ui = useUiStore();
  const { t } = useI18n();

  async function onRoleEnvChange(roleId: string, env: string): Promise<void> {
    settings.rolesState.roleStates[roleId].environment = env;
    settings.rolesState.roleStates[roleId].showProfileSelect = env === "cloud";
    await settings.rolesState.onEnvChange(roleId);
  }

  async function onRoleProfileChange(roleId: string, profile: string): Promise<void> {
    settings.rolesState.roleStates[roleId].remoteProfile = profile;
    await settings.rolesState.onRemoteProfilePick(roleId);
  }

  function onRoleModelSelChange(roleId: string, val: string): void {
    settings.rolesState.roleStates[roleId].modelSel = val;
    settings.rolesState.onModelSelect(roleId);
  }

  function onRoleModelCustomInput(roleId: string, val: string): void {
    settings.rolesState.roleStates[roleId].modelCustom = val;
    settings.saveSettingsSoon();
  }

  function onRolePromptSelChange(roleId: string, val: string): void {
    settings.rolesState.roleStates[roleId].promptSel = val;
    settings.rolesState.onPromptSelect(roleId);
  }

  function onRolePromptCustomInput(roleId: string, val: string): void {
    settings.rolesState.roleStates[roleId].promptCustom = val;
    settings.saveSettingsSoon();
  }

  function onRoleSkillIdsInput(roleId: string, val: string): void {
    settings.rolesState.roleStates[roleId].skillIds = val;
    settings.saveSettingsSoon();
  }

  type SwarmFormKey = keyof typeof settings.form;

  function onSwarmFormUpdate(field: string, value: string): void {
    const k = field as SwarmFormKey;
    const f = settings.form;
    if (typeof f[k] === "boolean") {
      (f as Record<string, unknown>)[k] = value === "true";
    } else {
      (f as Record<string, unknown>)[k] = value;
    }
    settings.saveSettingsSoon();
  }

  async function onAutoAssignModels(): Promise<void> {
    const err = await settings.rolesState.applyAssignments(
      settings.form.workspace_root,
    );
    if (err) {
      ui.taskError = `${t("toast.autoModelAssignmentFailed")}: ${err}`;
    }
  }

  function onOnboardingModelAssignments(assignments: ModelAssignment[]): void {
    const snap: Record<string, RoleSnapshot> = {};
    for (const a of assignments) {
      const env =
        a.provider === "ollama"
          ? "ollama"
          : a.provider === "lm_studio"
            ? "lmstudio"
            : "cloud";
      const existing = settings.rolesState.roleStates[a.role];
      snap[a.role] = {
        environment: env,
        model: a.model_id,
        prompt_path: existing ? settings.rolesState.effectivePromptPath(a.role) : "",
        remote_profile: existing?.remoteProfile || undefined,
      };
    }
    void settings.rolesState.applyRolesSnap(snap);
    settings.saveSettingsSoon();
  }

  return {
    onRoleEnvChange,
    onRoleProfileChange,
    onRoleModelSelChange,
    onRoleModelCustomInput,
    onRolePromptSelChange,
    onRolePromptCustomInput,
    onRoleSkillIdsInput,
    onSwarmFormUpdate,
    onAutoAssignModels,
    onOnboardingModelAssignments,
  };
}
