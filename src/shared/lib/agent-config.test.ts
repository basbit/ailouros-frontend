import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import {
  type AgentConfigForm,
  type AgentConfigSettings,
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

describe("buildAgentConfig visual probe settings", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("ailouros.locale", "en");
    setActivePinia(createPinia());
  });

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
      form: {
        ...baseForm(),
        swarm_visual_probe_enabled: false,
      },
    });

    expect(config?.swarm).toMatchObject({
      visual_probe: {
        enabled: false,
      },
    });
  });

  it("serializes media settings into swarm.media and legacy media", () => {
    const config = buildAgentConfig({
      ...emptyState,
      form: {
        ...baseForm(),
        media_enabled: true,
        media_image_provider: "openai",
        media_image_model: "gpt-image-1",
        media_budget_max_cost_usd: "2.5",
        media_budget_max_attempts: "3",
        media_license_policy: "permissive_only",
      },
    });

    const expectedMedia = {
      enabled: true,
      image: {
        provider: "openai",
        model: "gpt-image-1",
      },
      budget: {
        max_cost_usd_per_task: 2.5,
        max_attempts_per_asset: 3,
      },
      license_policy: "permissive_only",
    };
    expect(config?.swarm).toMatchObject({ media: expectedMedia });
    expect(config?.media).toMatchObject(expectedMedia);
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
