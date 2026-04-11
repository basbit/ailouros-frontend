import type { RoleId } from "@/shared/lib/pipeline-schema";

export interface SwarmPolicyDefaultsFallback {
  roles: readonly RoleId[];
  model_defaults: Record<RoleId, Record<string, string>>;
  prompt_defaults: Record<RoleId, string>;
  prompt_choices: Record<RoleId, [string, string][]>;
  remote_api_base_presets: Record<string, string>;
  remote_profile_provider_options: [string, string][];
  default_pipeline_order: string[];
  default_role_environment: string;
  default_remote_api_provider: string;
  default_swarm_provider: string;
}

export const FALLBACK_MODEL_DEFAULTS: Record<RoleId, Record<string, string>> = {
  pm: {
    ollama: "qwen3-coder:30b",
    lmstudio: "qwen3-coder:30b",
    cloud: "claude-3-5-sonnet-latest",
  },
  ba: {
    ollama: "qwen2.5-coder:14b",
    lmstudio: "qwen2.5-coder:14b",
    cloud: "claude-3-5-sonnet-latest",
  },
  architect: {
    ollama: "qwen2.5-coder:14b",
    lmstudio: "qwen2.5-coder:14b",
    cloud: "claude-3-5-sonnet-latest",
  },
  reviewer: {
    ollama: "qwen2.5-coder:14b",
    lmstudio: "qwen2.5-coder:14b",
    cloud: "claude-3-5-sonnet-latest",
  },
  stack_reviewer: {
    ollama: "qwen2.5-coder:14b",
    lmstudio: "qwen2.5-coder:14b",
    cloud: "claude-3-5-sonnet-latest",
  },
  dev: {
    ollama: "qwen2.5-coder:14b",
    lmstudio: "qwen2.5-coder:14b",
    cloud: "claude-3-5-sonnet-latest",
  },
  qa: {
    ollama: "qwen2.5-coder:14b",
    lmstudio: "qwen2.5-coder:14b",
    cloud: "claude-3-5-sonnet-latest",
  },
  problem_spotter: {
    ollama: "qwen2.5-coder:14b",
    lmstudio: "qwen2.5-coder:14b",
    cloud: "claude-3-5-sonnet-latest",
  },
  refactor_plan: {
    ollama: "qwen2.5-coder:14b",
    lmstudio: "qwen2.5-coder:14b",
    cloud: "claude-3-5-sonnet-latest",
  },
  code_diagram: {
    ollama: "qwen2.5-coder:14b",
    lmstudio: "qwen2.5-coder:14b",
    cloud: "claude-3-5-sonnet-latest",
  },
  doc_generate: {
    ollama: "qwen2.5-coder:14b",
    lmstudio: "qwen2.5-coder:14b",
    cloud: "claude-3-5-sonnet-latest",
  },
  devops: {
    ollama: "qwen2.5-coder:14b",
    lmstudio: "qwen2.5-coder:14b",
    cloud: "claude-3-5-sonnet-latest",
  },
  dev_lead: {
    ollama: "qwen3-coder:30b",
    lmstudio: "qwen3-coder:30b",
    cloud: "claude-3-5-sonnet-latest",
  },
};

export const FALLBACK_PROMPT_DEFAULTS: Record<RoleId, string> = {
  pm: "project-management/project-manager-senior.md",
  ba: "product/product-requirements-analyst.md",
  architect: "engineering/engineering-software-architect.md",
  reviewer: "specialized/specialized-reviewer.md",
  stack_reviewer: "specialized/specialized-reviewer.md",
  dev: "engineering/engineering-senior-developer.md",
  qa: "specialized/software-qa-engineer.md",
  problem_spotter: "specialized/code-problem-spotter.md",
  refactor_plan: "specialized/code-refactor-planner.md",
  code_diagram: "specialized/code-structure-diagram.md",
  doc_generate: "specialized/code-doc-generator.md",
  devops: "engineering/devops-setup.md",
  dev_lead: "project-management/dev-lead.md",
};

export const FALLBACK_PROMPT_CHOICES: Record<RoleId, [string, string][]> = {
  pm: [
    ["project-management/project-manager-senior.md", "PM senior"],
    ["project-management/project-management-project-shepherd.md", "Shepherd"],
    ["__custom__", "Custom…"],
  ],
  ba: [
    ["product/product-requirements-analyst.md", "BA requirements"],
    ["product/product-manager.md", "Product manager"],
    ["__custom__", "Custom…"],
  ],
  architect: [
    ["engineering/engineering-software-architect.md", "Architect"],
    ["__custom__", "Custom…"],
  ],
  reviewer: [
    ["specialized/specialized-reviewer.md", "Reviewer prompt"],
    ["__custom__", "Custom…"],
  ],
  stack_reviewer: [
    ["specialized/specialized-reviewer.md", "Reviewer prompt"],
    ["__custom__", "Custom…"],
  ],
  dev: [
    ["engineering/engineering-senior-developer.md", "Senior dev"],
    ["__custom__", "Custom…"],
  ],
  qa: [
    ["specialized/software-qa-engineer.md", "Software QA"],
    ["specialized/specialized-model-qa.md", "Model QA (ML)"],
    ["specialized/specialized-reviewer.md", "Reviewer prompt"],
    ["__custom__", "Custom…"],
  ],
  problem_spotter: [
    ["specialized/code-problem-spotter.md", "Problem spotter"],
    ["__custom__", "Custom…"],
  ],
  refactor_plan: [
    ["specialized/code-refactor-planner.md", "Refactor planner"],
    ["__custom__", "Custom…"],
  ],
  code_diagram: [
    ["specialized/code-structure-diagram.md", "Structure diagram"],
    ["__custom__", "Custom…"],
  ],
  doc_generate: [
    ["specialized/code-doc-generator.md", "Code doc generator"],
    ["specialized/specialized-document-generator.md", "Doc generator (alt)"],
    ["__custom__", "Custom…"],
  ],
  devops: [
    ["engineering/devops-setup.md", "DevOps setup"],
    ["engineering/engineering-devops-automator.md", "DevOps automator"],
    ["__custom__", "Custom…"],
  ],
  dev_lead: [
    ["project-management/dev-lead.md", "Dev lead"],
    ["__custom__", "Custom…"],
  ],
};

export const FALLBACK_REMOTE_API_BASE_PRESETS: Record<string, string> = {
  anthropic: "",
  openai_compatible: "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/",
  groq: "https://api.groq.com/openai/v1",
  cerebras: "https://api.cerebras.ai/v1",
  openrouter: "https://openrouter.ai/api/v1",
  deepseek: "https://api.deepseek.com/v1",
  ollama_cloud: "",
};

export const FALLBACK_REMOTE_PROFILE_PROVIDER_OPTS: [string, string][] = [
  ["anthropic", "Anthropic (Claude)"],
  ["openai_compatible", "OpenAI / compatible URL"],
  ["gemini", "Google Gemini"],
  ["groq", "Groq"],
  ["cerebras", "Cerebras"],
  ["openrouter", "OpenRouter"],
  ["deepseek", "DeepSeek API"],
  ["ollama_cloud", "Ollama Cloud (custom URL)"],
];
