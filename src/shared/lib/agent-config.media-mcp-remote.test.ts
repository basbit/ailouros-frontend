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

describe("buildAgentConfig media section", () => {
  it("serializes complete media block into both swarm.media and root media", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: {
        ...baseForm(),
        media_enabled: true,
        media_image_provider: "openai",
        media_image_model: "gpt-image-1",
        media_image_api_key: "img-key",
        media_audio_provider: "elevenlabs",
        media_audio_model: "tts-v1",
        media_audio_api_key: "aud-key",
        media_audio_voice: "alice",
        media_budget_max_cost_usd: "2.5",
        media_budget_max_attempts: "3",
        media_license_policy: "permissive_only",
      },
    });

    const expectedMedia = {
      enabled: true,
      image: { provider: "openai", model: "gpt-image-1", api_key: "img-key" },
      audio: {
        provider: "elevenlabs",
        model: "tts-v1",
        api_key: "aud-key",
        voice: "alice",
      },
      budget: { max_cost_usd_per_task: 2.5, max_attempts_per_asset: 3 },
      license_policy: "permissive_only",
    };
    expect(config?.swarm).toMatchObject({ media: expectedMedia });
    expect(config?.media).toMatchObject(expectedMedia);
  });

  it("omits media entirely when media_enabled is false", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), media_enabled: false, media_image_provider: "x" },
    });
    expect(config).not.toHaveProperty("media");
  });

  it("omits empty image/audio/budget sub-objects when their fields are blank", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: {
        ...baseForm(),
        media_enabled: true,
        media_license_policy: "default",
      },
    });
    expect(config?.media).toEqual({ enabled: true, license_policy: "default" });
  });

  it("drops invalid budget numbers (zero, negative, non-numeric)", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: {
        ...baseForm(),
        media_enabled: true,
        media_budget_max_cost_usd: "-1.0",
        media_budget_max_attempts: "abc",
      },
    });
    expect(config?.media as Record<string, unknown>).not.toHaveProperty("budget");
  });
});

describe("buildAgentConfig mcp section", () => {
  it("returns no mcp when input is empty/whitespace", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), mcp_servers_json: "   " },
    });
    expect(config).not.toHaveProperty("mcp");
  });

  it("returns null and reports invalid JSON", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), mcp_servers_json: "{not-json" },
    });
    expect(config).toBeNull();
    expect(agentConfigErrorMessage.value).not.toBeNull();
  });

  it("returns null and reports invalid shape for non-object JSON", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), mcp_servers_json: "[1, 2, 3]" },
    });
    expect(config).toBeNull();
    expect(agentConfigErrorMessage.value).not.toBeNull();
  });

  it("passes through pre-formatted servers array verbatim", () => {
    const payload = { servers: [{ name: "git", command: "uvx" }] };
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), mcp_servers_json: JSON.stringify(payload) },
    });
    expect(config?.mcp).toEqual(payload);
  });

  it("normalises mcpServers dict and skips entries without a command", () => {
    const mcpServers = {
      git: {
        command: "uvx",
        args: ["mcp-server-git"],
        cwd: "/tmp",
        env: { LOG: "info" },
      },
      brokenNoCommand: { args: ["x"] },
      ignoredNonObject: 42,
    };
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), mcp_servers_json: JSON.stringify({ mcpServers }) },
    });
    expect(config?.mcp).toEqual({
      servers: [
        {
          name: "git",
          command: "uvx",
          args: ["mcp-server-git"],
          cwd: "/tmp",
          env: { LOG: "info" },
        },
      ],
    });
  });

  it("returns null when mcpServers dict has zero usable entries", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: {
        ...baseForm(),
        mcp_servers_json: JSON.stringify({ mcpServers: { broken: { args: [] } } }),
      },
    });
    expect(config).toBeNull();
    expect(agentConfigErrorMessage.value).not.toBeNull();
  });
});

describe("buildAgentConfig remote_api section", () => {
  it("returns anthropic remote_api when api_key or base_url present", () => {
    const withKey = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), remote_api_provider: "anthropic", remote_api_key: "k" },
    });
    expect(withKey?.remote_api).toEqual({ provider: "anthropic", api_key: "k" });

    const withUrl = buildAgentConfig({
      ...emptyState,
      form: {
        ...baseForm(),
        remote_api_provider: "anthropic",
        remote_api_base_url: "https://api.anthropic.com",
      },
    });
    expect(withUrl?.remote_api).toEqual({
      provider: "anthropic",
      base_url: "https://api.anthropic.com",
    });
  });

  it("omits anthropic remote_api when both key and base_url are blank", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), remote_api_provider: "anthropic" },
    });
    expect(config).not.toHaveProperty("remote_api");
  });

  it.each([
    "openai_compatible",
    "gemini",
    "groq",
    "cerebras",
    "openrouter",
    "deepseek",
    "ollama_cloud",
  ])("always serialises remote_api for openai-compatible provider '%s'", (provider) => {
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), remote_api_provider: provider, remote_api_key: "k" },
    });
    expect(config?.remote_api).toMatchObject({ provider, api_key: "k" });
  });

  it("omits remote_api entirely for unknown providers", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), remote_api_provider: "weird-vendor" },
    });
    expect(config).not.toHaveProperty("remote_api");
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
