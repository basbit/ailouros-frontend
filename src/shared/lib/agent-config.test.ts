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

describe("buildAgentConfig visual probe settings", () => {
  it("serializes visual QA settings into swarm.visual_probe", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: {
        ...baseForm(),
        swarm_visual_base_url: " http://127.0.0.1:5173 ",
        swarm_visual_start_command: "npm run dev -- --host {host} --port {port}",
        swarm_visual_start_directory: "frontend",
        swarm_visual_ready_path: "/health",
        swarm_visual_pages: "/\n/settings, /tasks",
        swarm_visual_capture_har: true,
        swarm_visual_capture_trace: true,
        swarm_visual_multimodal_review: true,
        swarm_visual_max_review_images: "6",
      },
    });

    expect(config?.swarm).toMatchObject({
      visual_probe: {
        base_url: "http://127.0.0.1:5173",
        start_command: "npm run dev -- --host {host} --port {port}",
        start_directory: "frontend",
        ready_path: "/health",
        pages: ["/", "/settings", "/tasks"],
        capture_har: true,
        capture_trace: true,
        multimodal_review: true,
        max_review_images: 6,
      },
    });
  });

  it("keeps visual probe explicitly disabled when requested", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm(), swarm_visual_probe_enabled: false },
    });
    expect(config?.swarm).toMatchObject({ visual_probe: { enabled: false } });
  });

  it("omits default ready_path '/' and default pages ['/']", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: { ...baseForm() },
    });
    const swarm = (config?.swarm ?? {}) as Record<string, unknown>;
    expect(swarm).not.toHaveProperty("visual_probe");
  });

  it("ignores non-numeric and non-positive max_review_images", () => {
    const configNonNumeric = buildAgentConfig({
      ...emptyState,
      form: {
        ...baseForm(),
        swarm_visual_base_url: "http://x",
        swarm_visual_max_review_images: "not-a-number",
      },
    });
    const configNegative = buildAgentConfig({
      ...emptyState,
      form: {
        ...baseForm(),
        swarm_visual_base_url: "http://x",
        swarm_visual_max_review_images: "-1",
      },
    });
    const probe1 = ((configNonNumeric?.swarm as Record<string, unknown>).visual_probe ??
      {}) as Record<string, unknown>;
    const probe2 = ((configNegative?.swarm as Record<string, unknown>).visual_probe ??
      {}) as Record<string, unknown>;
    expect(probe1).not.toHaveProperty("max_review_images");
    expect(probe2).not.toHaveProperty("max_review_images");
  });
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
