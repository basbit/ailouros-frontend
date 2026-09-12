import {
  getCachedRolesCatalog,
  onRolesCatalogUpdate,
} from "@/shared/api/endpoints/rolesCatalog";

export type RoleId = string;

/** Role ids in catalog order, read fresh from the currently cached catalog. */
export function currentRoleIds(): readonly RoleId[] {
  return getCachedRolesCatalog().roles.map((r) => r.id);
}

const _ROLES_STATE: RoleId[] = getCachedRolesCatalog().roles.map((r) => r.id);

export const ROLES: readonly RoleId[] = _ROLES_STATE;

onRolesCatalogUpdate(() => {
  _ROLES_STATE.length = 0;
  for (const role of getCachedRolesCatalog().roles) {
    _ROLES_STATE.push(role.id);
  }
});

export const ROLE_NEEDS_TOOL_CALLING: Partial<Record<RoleId, boolean>> = {
  pm: true,
  architect: true,
  problem_spotter: true,
  refactor_plan: true,
  devops: true,
};

// config-discipline: code-owned (user-facing UI hint strings for role pickers)
export const ROLE_MODEL_HINT: Partial<Record<RoleId, string>> = {
  pm: "Requires tool calling support. Suggested: qwen3-coder:30b / claude / gpt-4o",
  ba: "Requirements analysis. Suggested: qwen2.5:14b+ / claude-haiku",
  architect: "Requires tool calling support. Suggested: qwen2.5-coder:14b+ / claude",
  code_quality_architect:
    "Architecture governance and code quality. Suggested: qwen2.5-coder:14b+ / claude",
  reviewer: "Review and debate. Suggested: any strong reasoning 7b+ model",
  stack_reviewer: "Stack analysis. Suggested: 7b+ is enough",
  dev: "Code generation. Suggested: qwen2.5-coder / deepseek-coder / claude",
  qa: "Test plans and code. Suggested: qwen2.5-coder:7b+ / claude-haiku",
  problem_spotter: "Requires tool calling support. Suggested: qwen2.5:14b+ / claude",
  refactor_plan: "Requires tool calling support. Suggested: qwen2.5:14b+ / deepseek-r1",
  devops: "Requires tool calling support. CI/CD. Suggested: qwen2.5-coder / claude",
  dev_lead: "Task planning. Suggested: qwen3-coder:30b / claude-sonnet",
  ux_researcher: "User research & personas. Suggested: qwen2.5:14b+ / claude",
  ux_architect: "UX architecture & CSS systems. Suggested: qwen2.5-coder:14b+ / claude",
  ui_designer: "Visual design & components. Suggested: qwen2.5:14b+ / claude",
  image_generator:
    "Image generation prompts and specs. Suggested: multimodal-capable cloud model",
  audio_generator:
    "Audio/TTS generation prompts and specs. Suggested: strong creative writing model",
  seo_specialist: "SEO strategy & technical audit. Suggested: qwen2.5:14b+ / claude",
  ai_citation_strategist: "AI citation & AEO/GEO. Suggested: qwen2.5:14b+ / claude",
  app_store_optimizer:
    "ASO & conversion optimization. Suggested: qwen2.5:14b+ / claude",
};
