/**
 * The run carries the interface language, so the pipeline can ask in it.
 *
 * Gate questions are written by the backend and shown to the operator as they
 * are. Without this the backend had no idea the interface was Russian and asked
 * in English: "Tracer story 'bootstrap_verify' went through all layers…".
 */
import { describe, it, expect } from "vitest";

import { buildSwarmSection } from "../swarm";
import type { AgentConfigForm } from "@/entities/agent-config/model/types";

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

describe("buildSwarmSection — interface language", () => {
  it("sends the interface language with the run", () => {
    expect(buildSwarmSection(baseForm(), "ru").ui_locale).toBe("ru");
  });

  it("omits it for english, which is what the backend writes by default", () => {
    expect(buildSwarmSection(baseForm(), "en")).not.toHaveProperty("ui_locale");
  });

  it("is a pure builder: the locale comes from the argument, not a store", () => {
    // No pinia is active in this test; a store read would throw.
    expect(buildSwarmSection(baseForm(), "ru").ui_locale).toBe("ru");
  });
});
