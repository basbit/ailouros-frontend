import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const automationOverride: Record<string, string | boolean> = {};
const searchKeysOverride: { tavily: string; exa: string; scrapingdog: string } = {
  tavily: "",
  exa: "",
  scrapingdog: "",
};

vi.mock("@/shared/lib/global-search-keys", () => ({
  getGlobalAutomationSettings: () => ({
    swarm_self_verify: false,
    swarm_self_verify_model: "",
    swarm_self_verify_provider: "",
    swarm_auto_approve: "",
    swarm_auto_approve_timeout: "",
    swarm_auto_retry: false,
    swarm_max_step_retries: "",
    swarm_deep_planning: false,
    swarm_deep_planning_model: "",
    swarm_deep_planning_provider: "",
    swarm_background_agent: false,
    swarm_background_agent_model: "",
    swarm_background_agent_provider: "",
    swarm_background_watch_paths: "",
    swarm_dream_enabled: false,
    swarm_quality_gate: false,
    swarm_auto_plan: false,
    swarm_planner_model: "",
    swarm_planner_provider: "",
    github_token: "",
    swarm_notify_enabled: false,
    swarm_notify_min_severity: "",
    swarm_notify_rate_limit_per_min: "",
    swarm_notify_webhook_url: "",
    swarm_notify_webhook_token: "",
    swarm_notify_email_sender: "",
    swarm_notify_email_recipients: "",
    swarm_notify_smtp_host: "",
    swarm_notify_smtp_port: "",
    swarm_notify_smtp_tls: true,
    swarm_notify_smtp_user: "",
    swarm_notify_smtp_password: "",
    swarm_notify_telegram_bot_token: "",
    swarm_notify_telegram_chat_id: "",
    swarm_notify_slack_webhook_url: "",
    swarm_notify_discord_webhook_url: "",
    ...automationOverride,
  }),
  getGlobalSearchKeys: () => ({ ...searchKeysOverride }),
}));

import {
  type AgentConfigForm,
  type AgentConfigSettings,
  agentConfigErrorMessage,
  buildAgentConfig,
} from "@/shared/lib/agent-config";

const emptyState: Omit<AgentConfigSettings, "form"> = {
  profilesState: {
    getDuplicateIds: () => [],
    collectAsObject: () => ({}),
  },
  rolesState: {
    collectRoleApiConfig: () => ({ environment: "ollama", model: "" }),
  },
  devRolesState: {
    collectForApi: () => [],
  },
  customRolesState: {
    collectSnap: () => [],
  },
  skillsState: {
    collectForApi: () => ({}),
  },
};

function resetAutomation(): void {
  for (const key of Object.keys(automationOverride)) delete automationOverride[key];
}

function resetSearchKeys(): void {
  searchKeysOverride.tavily = "";
  searchKeysOverride.exa = "";
  searchKeysOverride.scrapingdog = "";
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("ailouros.locale", "en");
  setActivePinia(createPinia());
  agentConfigErrorMessage.value = null;
  resetAutomation();
  resetSearchKeys();
});

describe("buildAgentConfig roles + dev_roles + custom roles + skills", () => {
  it("includes dev_roles array when devRolesState returns non-empty", () => {
    const config = buildAgentConfig({
      ...emptyState,
      devRolesState: {
        collectForApi: () => [{ name: "dev-x", environment: "ollama", model: "m" }],
      },
      form: baseForm(),
    });
    expect(config?.dev_roles).toEqual([
      { name: "dev-x", environment: "ollama", model: "m" },
    ]);
  });

  it("attaches human review block when human_manual_review is on", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), human_manual_review: true },
    });
    expect(config?.human).toEqual({ require_manual: true, auto_approve: false });
  });

  it("filters custom roles with invalid IDs and prefers prompt_text over prompt_path", () => {
    const config = buildAgentConfig({
      ...emptyState,
      customRolesState: {
        collectSnap: () => [
          {
            id: "valid_role",
            label: "Valid",
            environment: "ollama",
            model: "m1",
            prompt_text: "inline",
            prompt_path: "/ignored",
            skill_ids: "skill-a, skill-b",
          },
          {
            id: "1invalid",
            label: "X",
            environment: "ollama",
            model: "m2",
            prompt_text: "",
            prompt_path: "",
            skill_ids: "",
          },
          {
            id: "path_role",
            label: "",
            environment: "",
            model: "",
            prompt_text: "",
            prompt_path: "/role.md",
            skill_ids: "",
          },
        ],
      },
      form: baseForm(),
    });
    expect(config?.custom_roles).toEqual({
      valid_role: {
        title: "Valid",
        environment: "ollama",
        model: "m1",
        prompt_text: "inline",
        skill_ids: ["skill-a", "skill-b"],
      },
      path_role: {
        title: "path_role",
        environment: "ollama",
        model: "",
        prompt_path: "/role.md",
      },
    });
  });

  it("includes skills config when skillsState returns non-empty", () => {
    const config = buildAgentConfig({
      ...emptyState,
      skillsState: { collectForApi: () => ({ "skill-a": { enabled: true } }) },
      form: baseForm(),
    });
    expect(config?.skills).toEqual({ "skill-a": { enabled: true } });
  });

  it("omits custom_roles and skills when both sources are empty", () => {
    const config = buildAgentConfig({ ...emptyState, form: baseForm() });
    expect(config).not.toHaveProperty("custom_roles");
    expect(config).not.toHaveProperty("skills");
  });
});

function baseForm(): AgentConfigForm {
  return {
    human_manual_review: false,
    swarm_languages: "",
    swarm_topology: "",
    swarm_pattern_memory: false,
    swarm_pipeline_hooks_module: "",
    swarm_mcp_auto: true,
    swarm_skip_mcp_tools: false,
    swarm_doc_locale: "",
    swarm_documentation_sources: "",
    swarm_database_url: "",
    swarm_database_hint: "",
    swarm_database_readonly: true,
    swarm_disable_tree_sitter: false,
    swarm_visual_probe_enabled: true,
    swarm_visual_base_url: "",
    swarm_visual_start_command: "",
    swarm_visual_start_directory: "",
    swarm_visual_ready_path: "/",
    swarm_visual_pages: "/",
    swarm_visual_capture_har: false,
    swarm_visual_capture_trace: false,
    swarm_visual_multimodal_review: false,
    swarm_visual_max_review_images: "4",
    mcp_servers_json: "",
    swarm_tavily_api_key: "",
    swarm_exa_api_key: "",
    swarm_scrapingdog_api_key: "",
    media_enabled: false,
    media_image_provider: "",
    media_image_model: "",
    media_image_api_key: "",
    media_audio_provider: "",
    media_audio_model: "",
    media_audio_api_key: "",
    media_audio_voice: "",
    media_budget_max_cost_usd: "",
    media_budget_max_attempts: "",
    media_license_policy: "",
    swarm_memory_namespace: "default",
    swarm_pattern_memory_path: "",
    swarm_force_rerun: false,
    remote_api_provider: "",
    remote_api_key: "",
    remote_api_base_url: "",
    prompt: "",
    workspace_root: "",
    project_context_file: "",
    workspace_write: false,
    scenario_id: null,
    favorite_scenarios: [],
    scenario_overrides: {},
  };
}
