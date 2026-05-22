import { useI18n } from "@/shared/lib/i18n";
import { ROLES } from "@/shared/lib/pipeline-schema";
import { parseSkillIds } from "@/shared/lib/skill-utils";
import { agentConfigErrorMessage } from "@/shared/lib/agent-config-error";
import type {
  AgentConfigForm,
  CustomRolesStateLike,
  DevRolesStateLike,
  ProfilesStateLike,
  RolesStateLike,
  SkillsStateLike,
} from "@/shared/lib/agent-config-types";
import type { CustomRoleSnap } from "@/shared/model/project-types";

type Translator = ReturnType<typeof useI18n>["t"];

const CUSTOM_ROLE_ID_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
const PROFILE_ID_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

export function buildProfilesConfig(
  profilesState: ProfilesStateLike,
  translate: Translator,
): Record<string, unknown> | null {
  const duplicateIds = profilesState.getDuplicateIds();
  if (duplicateIds.length) {
    agentConfigErrorMessage.value = translate("errors.duplicateProfileId", {
      ids: duplicateIds.join(", "),
    });
    return null;
  }
  const profilesObject = profilesState.collectAsObject();
  const invalidIds = Object.keys(profilesObject).filter(
    (id) => !PROFILE_ID_PATTERN.test(id),
  );
  if (invalidIds.length) {
    agentConfigErrorMessage.value = translate("errors.invalidProfileId", {
      ids: invalidIds.join(", "),
    });
    return null;
  }
  return profilesObject;
}

export function buildRolesConfig(
  rolesState: RolesStateLike,
  devRolesState: DevRolesStateLike,
  form: AgentConfigForm,
): Record<string, unknown> {
  const config: Record<string, unknown> = Object.fromEntries(
    ROLES.map((roleId) => [roleId, rolesState.collectRoleApiConfig(roleId)]),
  );
  const devRolesArray = devRolesState.collectForApi();
  if (devRolesArray.length) config.dev_roles = devRolesArray;
  if (form.human_manual_review) {
    config.human = { require_manual: true, auto_approve: false };
  }
  return config;
}

function buildCustomRoleEntry(role: CustomRoleSnap): Record<string, unknown> {
  const entry: Record<string, unknown> = {
    title: role.label || role.id,
    environment: role.environment || "ollama",
    model: role.model || "",
  };
  const promptText = (role.prompt_text ?? "").trim();
  const promptPath = (role.prompt_path ?? "").trim();
  if (promptText) entry.prompt_text = promptText;
  else if (promptPath) entry.prompt_path = promptPath;
  const skillIds = parseSkillIds(role.skill_ids ?? "");
  if (skillIds.length) entry.skill_ids = skillIds;
  return entry;
}

interface CustomRolesAndSkills {
  customRoles?: Record<string, unknown>;
  skills?: Record<string, unknown>;
}

export function buildCustomRolesSection(
  customRolesState: CustomRolesStateLike,
  skillsState: SkillsStateLike,
): CustomRolesAndSkills {
  const result: CustomRolesAndSkills = {};
  const customRolesArray = customRolesState.collectSnap();
  if (customRolesArray.length) {
    const customRolesConfig: Record<string, unknown> = {};
    for (const role of customRolesArray) {
      if (!role.id || !CUSTOM_ROLE_ID_PATTERN.test(role.id)) continue;
      customRolesConfig[role.id] = buildCustomRoleEntry(role);
    }
    if (Object.keys(customRolesConfig).length) {
      result.customRoles = customRolesConfig;
    }
  }
  const skillsConfig = skillsState.collectForApi();
  if (Object.keys(skillsConfig).length) result.skills = skillsConfig;
  return result;
}
