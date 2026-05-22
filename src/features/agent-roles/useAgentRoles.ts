import { ref } from "vue";
import { parseSkillIds } from "@/shared/lib/skill-utils";
import { ROLES } from "@/shared/lib/pipeline-schema";
import { defaultModelForRole } from "@/shared/lib/use-swarm-defaults";
import { ensureModelChoicesForEnv } from "@/shared/lib/use-model-list";
import { getOnboardingModels } from "@/shared/api/endpoints/onboarding";
import type { RoleSnapshot } from "@/entities/role";
import type { RemoteProfileRow } from "@/entities/remote-profile";
import { useRoleState } from "./useRoleState";
import { useRoleModelSelector } from "./useRoleModelSelector";
import { useRolePromptSelector } from "./useRolePromptSelector";
import {
  applyOneAssignment,
  applyRoleSnapshot,
  normalizeRolesSnap,
  type Assignment,
} from "./agent-roles-helpers";

export type { RoleState } from "./useRoleState";

export function useAgentRoles(
  profiles: { value: RemoteProfileRow[] },
  onChangeCb: () => void,
) {
  const stateApi = useRoleState();
  const { roleStates, getRoleState, effectiveModel, effectivePromptPath } = stateApi;

  const isBooting = ref(true);

  const modelApi = useRoleModelSelector({ profiles, getRoleState, effectiveModel });
  const promptApi = useRolePromptSelector({ getRoleState });

  function getProfileProvider(profileId: string): string {
    const row = profiles.value.find((profile) => profile.id === profileId);
    return row?.provider ?? "";
  }

  function profileOptionsForRole(): { value: string; label: string }[] {
    return profiles.value
      .filter((profile) => profile.id.trim())
      .map((profile) => ({
        value: profile.id,
        label: `${profile.id} (${profile.provider})`,
      }));
  }

  async function onEnvChange(roleId: string): Promise<void> {
    const roleState = getRoleState(roleId);
    if (!roleState) return;
    const env = roleState.environment;
    roleState.showProfileSelect = env === "cloud";
    roleState.modelFetchError = null;
    try {
      const choices = await modelApi.loadModelChoices(roleId, env);
      const defaultModel = defaultModelForRole(roleId, env);
      await modelApi.applyModelChoices(
        roleId,
        choices,
        effectiveModel(roleId) || defaultModel,
      );
    } catch (e) {
      roleState.modelFetchError = e instanceof Error ? e.message : String(e);
      roleState.modelChoices = [];
    }
    if (!isBooting.value) onChangeCb();
  }

  async function onRemoteProfilePick(roleId: string): Promise<void> {
    const roleState = getRoleState(roleId);
    if (!roleState) return;
    roleState.modelFetchError = null;
    try {
      const choices = await modelApi.fetchCloudChoices(roleId);
      await modelApi.applyModelChoices(roleId, choices, effectiveModel(roleId));
    } catch (e) {
      roleState.modelFetchError = e instanceof Error ? e.message : String(e);
      roleState.modelChoices = [];
    }
    if (!isBooting.value) onChangeCb();
  }

  function refreshAllProfileSelects(): void {}

  function onModelSelect(roleId: string): void {
    modelApi.onModelSelect(roleId);
    if (!isBooting.value) onChangeCb();
  }

  function onPromptSelect(roleId: string): void {
    promptApi.onPromptSelect(roleId);
    if (!isBooting.value) onChangeCb();
  }

  async function initDefaults(): Promise<void> {
    await Promise.all(
      ROLES.map(async (roleId) => {
        const roleState = roleStates[roleId];
        roleState.modelFetchError = null;
        try {
          const choices = await ensureModelChoicesForEnv(roleState.environment);
          roleState.modelChoices = choices;
          const defModel = defaultModelForRole(roleId, roleState.environment);
          await modelApi.applyModelChoices(roleId, choices, defModel);
        } catch (e) {
          roleState.modelFetchError = e instanceof Error ? e.message : String(e);
          roleState.modelChoices = [];
        }
        promptApi.resetPromptToDefault(roleId);
      }),
    );
  }

  async function applyRolesSnap(snap: Record<string, RoleSnapshot>): Promise<void> {
    const norm = normalizeRolesSnap(snap ?? {});
    await Promise.all(
      ROLES.map((roleId) =>
        applyRoleSnapshot(
          roleId,
          norm[roleId],
          getRoleState(roleId),
          modelApi,
          promptApi,
        ),
      ),
    );
  }

  function collectRolesSnap(): Record<string, RoleSnapshot> {
    const out: Record<string, RoleSnapshot> = {};
    for (const roleId of ROLES) {
      const roleState = roleStates[roleId];
      if (!roleState) continue;
      const entry: RoleSnapshot = {
        environment: roleState.environment,
        model: effectiveModel(roleId),
        prompt_path: effectivePromptPath(roleId),
        skill_ids: roleState.skillIds,
        remote_profile: roleState.remoteProfile || undefined,
      };
      const trimmedPromptText = roleState.promptText.trim();
      if (trimmedPromptText) entry.prompt_text = trimmedPromptText;
      out[roleId] = entry;
    }
    return out;
  }

  function collectRoleApiConfig(roleId: string): {
    environment: string;
    model: string;
    prompt_path: string;
    prompt_text?: string;
    skill_ids?: string[];
    remote_profile?: string;
  } {
    const roleState = roleStates[roleId];
    if (!roleState) return { environment: "ollama", model: "", prompt_path: "" };
    const sids = parseSkillIds(roleState.skillIds);
    const trimmedPromptText = roleState.promptText.trim();
    return {
      environment: roleState.environment,
      model: effectiveModel(roleId),
      prompt_path: effectivePromptPath(roleId),
      ...(trimmedPromptText ? { prompt_text: trimmedPromptText } : {}),
      ...(sids.length ? { skill_ids: sids } : {}),
      ...(roleState.remoteProfile ? { remote_profile: roleState.remoteProfile } : {}),
    };
  }

  async function applyAssignments(workspaceRoot: string): Promise<string> {
    try {
      const data = await getOnboardingModels((workspaceRoot || "").trim());
      const assignments: Assignment[] = data.assignments ?? [];
      await Promise.all(
        assignments.map((assignment) =>
          applyOneAssignment(assignment, getRoleState(assignment.role), modelApi),
        ),
      );
      onChangeCb();
      return "";
    } catch (e: unknown) {
      return e instanceof Error ? e.message : String(e);
    }
  }

  return {
    roleStates,
    isBooting,
    profileOptionsForRole,
    effectiveModel,
    effectivePromptPath,
    onEnvChange,
    onRemoteProfilePick,
    refreshAllProfileSelects,
    onModelSelect,
    onPromptSelect,
    initDefaults,
    applyRolesSnap,
    collectRolesSnap,
    collectRoleApiConfig,
    getProfileProvider,
    applyAssignments,
  };
}
