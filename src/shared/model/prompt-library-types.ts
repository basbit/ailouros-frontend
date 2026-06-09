type PromptInputKind = "text" | "long_text" | "select";

type PromptTemplateStatus = "enabled" | "disabled";

interface PromptSource {
  url: string;
  version: string;
  license_status: string;
}

export interface PromptInputSpec {
  name: string;
  label: string;
  kind: PromptInputKind;
  required: boolean;
  placeholder: string;
  options: string[];
  default_value: string;
}

export interface PromptTemplateSummary {
  id: string;
  pack_id: string;
  title: string;
  description: string;
  category: string;
  requires_user_confirmation: boolean;
  status: PromptTemplateStatus;
  source: PromptSource;
}

export interface PromptTemplateDetail extends PromptTemplateSummary {
  inputs: PromptInputSpec[];
}

export interface PromptPackSummary {
  id: string;
  title: string;
  description: string;
  source: PromptSource;
}

export interface PromptLibraryCatalog {
  packs: PromptPackSummary[];
  templates: PromptTemplateSummary[];
}

export interface RenderedPrompt {
  template_id: string;
  body: string;
  used_inputs: Record<string, string>;
}
