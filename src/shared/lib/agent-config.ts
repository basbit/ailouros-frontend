import { useI18n } from "@/shared/lib/i18n";
import { getGlobalAutomationSettings } from "@/shared/lib/global-search-keys";
import { buildMediaSection } from "@/shared/lib/agent-config-sections/media";
import { buildMcpSection } from "@/shared/lib/agent-config-sections/mcp";
import { buildRemoteApiSection } from "@/shared/lib/agent-config-sections/remote-api";
import {
  buildCustomRolesSection,
  buildProfilesConfig,
  buildRolesConfig,
} from "@/shared/lib/agent-config-sections/roles";
import { buildSwarmSection } from "@/shared/lib/agent-config-sections/swarm";

export { agentConfigErrorMessage } from "@/shared/lib/agent-config-error";
export type {
  AgentConfigForm,
  AgentConfigSettings,
  RunSwarmChatSettings,
} from "@/shared/lib/agent-config-types";

import type {
  AgentConfigSettings,
  AgentConfigForm,
} from "@/shared/lib/agent-config-types";

function attachMediaToSwarm(
  config: Record<string, unknown>,
  media: Record<string, unknown>,
): void {
  const existingSwarm =
    config.swarm && typeof config.swarm === "object"
      ? (config.swarm as Record<string, unknown>)
      : {};
  existingSwarm.media = media;
  config.swarm = existingSwarm;
  config.media = media;
}

function attachPlannerConfig(config: Record<string, unknown>): void {
  const automation = getGlobalAutomationSettings();
  const plannerModel = automation.swarm_planner_model.trim();
  if (!plannerModel) return;
  const plannerConfig: Record<string, string> = { model: plannerModel };
  const plannerProvider = automation.swarm_planner_provider.trim();
  if (plannerProvider) plannerConfig.environment = plannerProvider;
  config.swarm_planner = plannerConfig;
}

function attachSwarmSection(
  config: Record<string, unknown>,
  form: AgentConfigForm,
): void {
  const swarmSection = buildSwarmSection(form);
  if (Object.keys(swarmSection).length) config.swarm = swarmSection;
}

export function buildAgentConfig(
  settings: AgentConfigSettings,
): Record<string, unknown> | null {
  const { t: translate } = useI18n();
  const {
    form,
    rolesState,
    devRolesState,
    customRolesState,
    skillsState,
    profilesState,
  } = settings;

  const profilesObject = buildProfilesConfig(profilesState, translate);
  if (profilesObject === null) return null;

  const config: Record<string, unknown> = {
    ...buildRolesConfig(rolesState, devRolesState, form),
  };

  attachSwarmSection(config, form);

  const mediaSection = buildMediaSection(form);
  if (mediaSection) attachMediaToSwarm(config, mediaSection);

  attachPlannerConfig(config);

  const remoteApiSection = buildRemoteApiSection(form);
  if (remoteApiSection) config.remote_api = remoteApiSection;

  const mcpSection = buildMcpSection(form, translate);
  if (mcpSection === null) return null;
  if (mcpSection !== undefined) config.mcp = mcpSection;

  if (Object.keys(profilesObject).length) {
    config.remote_api_profiles = profilesObject;
  }

  const { customRoles, skills } = buildCustomRolesSection(
    customRolesState,
    skillsState,
  );
  if (customRoles) config.custom_roles = customRoles;
  if (skills) config.skills = skills;

  return config;
}
