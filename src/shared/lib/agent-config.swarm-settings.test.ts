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
    swarm_self_verify_remote_profile: "",
    swarm_auto_approve: "",
    swarm_auto_approve_timeout: "",
    swarm_auto_retry: false,
    swarm_max_step_retries: "",
    swarm_deep_planning: false,
    swarm_deep_planning_model: "",
    swarm_deep_planning_provider: "",
    swarm_deep_planning_remote_profile: "",
    swarm_background_agent: false,
    swarm_background_agent_model: "",
    swarm_background_agent_provider: "",
    swarm_background_watch_paths: "",
    swarm_dream_enabled: false,
    swarm_quality_gate: false,
    swarm_auto_plan: false,
    swarm_planner_model: "",
    swarm_planner_provider: "",
    swarm_planner_remote_profile: "",
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

describe("buildAgentConfig swarm topology, database, documentation", () => {
  it("includes topology, pipeline_hooks_module, documentation_locale, database_url/hint", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: {
        ...baseForm(),
        swarm_topology: "  mesh  ",
        swarm_pipeline_hooks_module: " my.hooks ",
        swarm_doc_locale: "ru",
        swarm_database_url: "postgres://localhost",
        swarm_database_hint: "primary",
      },
    });
    expect(config?.swarm).toMatchObject({
      topology: "mesh",
      pipeline_hooks_module: "my.hooks",
      documentation_locale: "ru",
      database_url: "postgres://localhost",
      database_hint: "primary",
    });
  });

  it("parses documentation_sources with title|note|url lines", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: {
        ...baseForm(),
        swarm_documentation_sources: [
          "# comment",
          "https://example.com/raw",
          "Doc Title | https://example.com/doc",
          "Another | optional note | https://example.com/with-note",
          "broken-line-without-url",
        ].join("\n"),
      },
    });
    expect((config?.swarm as Record<string, unknown>).documentation_sources).toEqual([
      { url: "https://example.com/raw" },
      { title: "Doc Title", url: "https://example.com/doc" },
      {
        title: "Another",
        note: "optional note",
        url: "https://example.com/with-note",
      },
    ]);
  });
});

describe("buildAgentConfig swarm automation settings", () => {
  it("propagates self_verify settings when provider/model present", () => {
    automationOverride.swarm_self_verify = true;
    automationOverride.swarm_self_verify_provider = " ollama ";
    automationOverride.swarm_self_verify_model = " llama3 ";
    const config = buildAgentConfig({ ...emptyState, form: baseForm() });
    expect(config?.swarm).toMatchObject({
      self_verify: true,
      self_verify_provider: "ollama",
      self_verify_model: "llama3",
    });
  });

  it("parses auto_approve_timeout only when positive integer", () => {
    automationOverride.swarm_auto_approve = "all";
    automationOverride.swarm_auto_approve_timeout = "30";
    const validConfig = buildAgentConfig({ ...emptyState, form: baseForm() });
    expect(validConfig?.swarm).toMatchObject({
      auto_approve: "all",
      auto_approve_timeout: 30,
    });

    automationOverride.swarm_auto_approve_timeout = "garbage";
    const invalidConfig = buildAgentConfig({ ...emptyState, form: baseForm() });
    expect(invalidConfig?.swarm).toMatchObject({ auto_approve: "all" });
    expect(invalidConfig?.swarm as Record<string, unknown>).not.toHaveProperty(
      "auto_approve_timeout",
    );
  });

  it("propagates auto_retry with positive max_step_retries only", () => {
    automationOverride.swarm_auto_retry = true;
    automationOverride.swarm_max_step_retries = "3";
    const config = buildAgentConfig({ ...emptyState, form: baseForm() });
    expect(config?.swarm).toMatchObject({ auto_retry: true, max_step_retries: 3 });

    automationOverride.swarm_max_step_retries = "0";
    const zeroConfig = buildAgentConfig({ ...emptyState, form: baseForm() });
    expect(zeroConfig?.swarm as Record<string, unknown>).not.toHaveProperty(
      "max_step_retries",
    );
  });

  it("propagates deep_planning, background_agent, dream and quality flags", () => {
    automationOverride.swarm_deep_planning = true;
    automationOverride.swarm_deep_planning_provider = "openai";
    automationOverride.swarm_deep_planning_model = "gpt-4o";
    automationOverride.swarm_background_agent = true;
    automationOverride.swarm_background_agent_provider = "anthropic";
    automationOverride.swarm_background_agent_model = "claude-3";
    automationOverride.swarm_background_watch_paths = "src,docs";
    automationOverride.swarm_dream_enabled = true;
    automationOverride.swarm_quality_gate = true;
    automationOverride.swarm_auto_plan = true;
    const config = buildAgentConfig({ ...emptyState, form: baseForm() });
    expect(config?.swarm).toMatchObject({
      deep_planning: true,
      deep_planning_provider: "openai",
      deep_planning_model: "gpt-4o",
      background_agent: true,
      background_agent_provider: "anthropic",
      background_agent_model: "claude-3",
      background_watch_paths: "src,docs",
      dream_enabled: true,
      quality_gate_enabled: true,
      auto_plan: true,
    });
  });

  it("attaches swarm_planner only when planner_model is set", () => {
    automationOverride.swarm_planner_model = "planner-v1";
    automationOverride.swarm_planner_provider = "openai";
    const config = buildAgentConfig({ ...emptyState, form: baseForm() });
    expect(config?.swarm_planner).toEqual({
      model: "planner-v1",
      environment: "openai",
    });

    automationOverride.swarm_planner_model = "";
    const without = buildAgentConfig({ ...emptyState, form: baseForm() });
    expect(without).not.toHaveProperty("swarm_planner");
  });

  it("attaches the planner remote_profile when set (cloud agent-parity)", () => {
    automationOverride.swarm_planner_model = "planner-v1";
    automationOverride.swarm_planner_provider = "cloud";
    automationOverride.swarm_planner_remote_profile = "prodB";
    const config = buildAgentConfig({ ...emptyState, form: baseForm() });
    expect(config?.swarm_planner).toEqual({
      model: "planner-v1",
      environment: "cloud",
      remote_profile: "prodB",
    });
  });
});

describe("buildAgentConfig swarm search api keys precedence", () => {
  it("uses global keys when present, regardless of form input", () => {
    searchKeysOverride.tavily = "TAVILY-GLOBAL";
    searchKeysOverride.exa = "EXA-GLOBAL";
    searchKeysOverride.scrapingdog = "SD-GLOBAL";
    const config = buildAgentConfig({
      ...emptyState,
      form: {
        ...baseForm(),
        swarm_tavily_api_key: "form-ignored",
        swarm_exa_api_key: "form-ignored",
        swarm_scrapingdog_api_key: "form-ignored",
      },
    });
    expect(config?.swarm).toMatchObject({
      tavily_api_key: "TAVILY-GLOBAL",
      exa_api_key: "EXA-GLOBAL",
      scrapingdog_api_key: "SD-GLOBAL",
    });
  });

  it("falls back to form keys when global keys are empty", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: {
        ...baseForm(),
        swarm_tavily_api_key: " form-tavily ",
        swarm_exa_api_key: "",
        swarm_scrapingdog_api_key: "",
      },
    });
    expect(config?.swarm).toMatchObject({ tavily_api_key: "form-tavily" });
    expect(config?.swarm as Record<string, unknown>).not.toHaveProperty("exa_api_key");
  });
});

describe("buildAgentConfig swarm workspace_context_mode", () => {
  it("propagates a non-default workspace_context_mode into the swarm payload", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), workspace_context_mode: "tools_only" },
    });
    expect(config?.swarm).toMatchObject({ workspace_context_mode: "tools_only" });
  });

  it("omits workspace_context_mode when it equals the backend default (retrieve)", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), workspace_context_mode: "retrieve" },
    });
    expect(config?.swarm).toBeUndefined();
  });
});

describe("buildAgentConfig swarm memory settings", () => {
  it("attaches non-default memory namespace and pattern_memory_path", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: {
        ...baseForm(),
        swarm_memory_namespace: " custom-ns ",
        swarm_pattern_memory_path: " /var/pm ",
      },
    });
    expect(config?.swarm).toMatchObject({
      cross_task_memory: { namespace: "custom-ns" },
      pattern_memory_path: "/var/pm",
    });
  });

  it("omits cross_task_memory when namespace is 'default'", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), swarm_memory_namespace: "default" },
    });
    expect(config?.swarm).toBeUndefined();
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
