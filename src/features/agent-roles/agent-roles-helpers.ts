import {
  defaultEnvironmentForRole,
  defaultModelForRole,
  defaultPromptPathForRole,
} from "@/shared/lib/use-swarm-defaults";
import type { RoleSnapshot } from "@/entities/role";
import type { RoleState } from "./useRoleState";
import type { useRoleModelSelector } from "./useRoleModelSelector";
import type { useRolePromptSelector } from "./useRolePromptSelector";

type ModelApi = ReturnType<typeof useRoleModelSelector>;
type PromptApi = ReturnType<typeof useRolePromptSelector>;

export function normalizeRolesSnap(
  snap: Record<string, RoleSnapshot>,
): Record<string, RoleSnapshot> {
  const out: Record<string, RoleSnapshot> = { ...snap };
  const legacyArch = out.arch as RoleSnapshot | undefined;
  if (legacyArch && !out.architect) {
    out.architect = { ...legacyArch };
  }
  if (out.arch) delete out.arch;
  return out;
}

export async function applyRoleSnapshot(
  roleId: string,
  roleConfig: RoleSnapshot | undefined,
  roleState: RoleState | undefined,
  modelApi: ModelApi,
  promptApi: PromptApi,
): Promise<void> {
  if (!roleState) return;
  if (roleConfig) {
    roleState.environment = roleConfig.environment ?? defaultEnvironmentForRole();
    roleState.remoteProfile = roleConfig.remote_profile ?? "";
    roleState.skillIds = roleConfig.skill_ids ?? "";
  } else {
    roleState.environment = defaultEnvironmentForRole();
    roleState.remoteProfile = "";
    roleState.skillIds = "";
  }
  roleState.showProfileSelect = roleState.environment === "cloud";
  roleState.modelFetchError = null;

  try {
    const choices = await modelApi.loadModelChoices(roleId, roleState.environment);
    roleState.modelChoices = choices;
    const wantModel =
      roleConfig?.model ?? defaultModelForRole(roleId, roleState.environment);
    await modelApi.applyModelChoices(roleId, choices, wantModel);
  } catch (e) {
    roleState.modelFetchError = e instanceof Error ? e.message : String(e);
    roleState.modelChoices = [];
  }

  const wantPrompt = roleConfig?.prompt_path ?? defaultPromptPathForRole(roleId);
  promptApi.applyPromptPath(roleId, wantPrompt);
  roleState.promptText = roleConfig?.prompt_text ?? "";
}

function providerToEnv(provider: string): string {
  if (provider === "lm_studio" || provider === "lm-studio") return "lmstudio";
  if (provider === "ollama" || provider === "") return "ollama";
  if (provider === "local" || provider === "llamacpp") return "local";
  return "cloud";
}

export interface Assignment {
  role: string;
  model_id: string;
  provider: string;
  remote_profile?: string;
}

export async function applyOneAssignment(
  assignment: Assignment,
  roleState: RoleState | undefined,
  modelApi: ModelApi,
): Promise<void> {
  if (!roleState) return;
  const env = providerToEnv(assignment.provider);
  roleState.environment = env;
  roleState.showProfileSelect = env === "cloud";
  roleState.modelFetchError = null;
  if (assignment.remote_profile) {
    roleState.remoteProfile = assignment.remote_profile;
  }
  try {
    const choices = await modelApi.loadModelChoices(assignment.role, env);
    await modelApi.applyModelChoices(assignment.role, choices, assignment.model_id);
  } catch (e) {
    roleState.modelFetchError = e instanceof Error ? e.message : String(e);
    roleState.modelChoices = [];
    roleState.modelSel = "__custom__";
    roleState.modelCustom = assignment.model_id;
  }
}
