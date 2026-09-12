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
} from "@/entities/agent-config";

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
  crossValidationState: {
    collectForApi: () => null,
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

describe("buildAgentConfig profile validation", () => {
  it("returns null and reports duplicate profile IDs", () => {
    const config = buildAgentConfig({
      ...emptyState,
      profilesState: {
        getDuplicateIds: () => ["profile-a", "profile-b"],
        collectAsObject: () => ({}),
      },
      form: baseForm(),
    });
    expect(config).toBeNull();
    expect(agentConfigErrorMessage.value).toContain("profile-a");
    expect(agentConfigErrorMessage.value).toContain("profile-b");
  });

  it("returns null and reports IDs that violate the naming pattern", () => {
    const config = buildAgentConfig({
      ...emptyState,
      profilesState: {
        getDuplicateIds: () => [],
        collectAsObject: () => ({ "1bad": {}, "ok-name": {}, "with space": {} }),
      },
      form: baseForm(),
    });
    expect(config).toBeNull();
    expect(agentConfigErrorMessage.value).toContain("1bad");
    expect(agentConfigErrorMessage.value).toContain("with space");
    expect(agentConfigErrorMessage.value).not.toContain("ok-name");
  });

  it("includes valid profile objects under remote_api_profiles", () => {
    const config = buildAgentConfig({
      ...emptyState,
      profilesState: {
        getDuplicateIds: () => [],
        collectAsObject: () => ({ "openai-main": { provider: "openai" } }),
      },
      form: baseForm(),
    });
    expect(config?.remote_api_profiles).toEqual({
      "openai-main": { provider: "openai" },
    });
  });

  it("omits remote_api_profiles when no profiles are defined", () => {
    const config = buildAgentConfig({ ...emptyState, form: baseForm() });
    expect(config).not.toHaveProperty("remote_api_profiles");
  });
});

describe("buildAgentConfig swarm.languages parsing", () => {
  it("splits whitespace + commas, lowercases and de-duplicates", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), swarm_languages: " EN, ru,\tPt " },
    });
    expect((config?.swarm as Record<string, unknown>).languages).toEqual([
      "en",
      "ru",
      "pt",
    ]);
  });

  it("omits languages entirely when input is whitespace only", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), swarm_languages: "   " },
    });
    expect(config?.swarm).toBeUndefined();
  });
});

describe("buildAgentConfig swarm boolean toggles and negations", () => {
  it("sets pattern_memory and force_rerun when enabled", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: {
        ...baseForm(),
        swarm_pattern_memory: true,
        swarm_force_rerun: true,
      },
    });
    expect(config?.swarm).toMatchObject({
      pattern_memory: true,
      force_rerun: true,
    });
  });

  it("sets mcp_auto=false only when explicitly disabled", () => {
    const enabled = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), swarm_mcp_auto: true },
    });
    const disabled = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), swarm_mcp_auto: false, swarm_topology: "mesh" },
    });
    expect(enabled?.swarm).toBeUndefined();
    expect(disabled?.swarm).toMatchObject({ mcp_auto: false, topology: "mesh" });
  });

  it("sets database_readonly=false only when explicitly disabled", () => {
    const explicit = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), swarm_database_readonly: false, swarm_topology: "ring" },
    });
    expect(explicit?.swarm).toMatchObject({ database_readonly: false });
  });

  it("sets skip_mcp_tools and disable_tree_sitter when enabled", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: {
        ...baseForm(),
        swarm_skip_mcp_tools: true,
        swarm_disable_tree_sitter: true,
      },
    });
    expect(config?.swarm).toMatchObject({
      skip_mcp_tools: true,
      disable_tree_sitter: true,
    });
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
