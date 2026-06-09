import { computed, reactive } from "vue";
import type { ComputedRef, Ref } from "vue";
import {
  getPromptTemplate,
  renderPromptTemplate,
} from "@/shared/api/endpoints/prompt-library";
import {
  usePromptLibraryCatalog,
  type PromptInputSpec,
  type PromptTemplateDetail,
  type PromptTemplateSummary,
  type RenderedPrompt,
} from "@/entities/prompt-template";

type PromptCoachStage = "picker" | "form" | "preview";

interface PromptCoachState {
  stage: PromptCoachStage;
  selectedTemplate: PromptTemplateDetail | null;
  inputValues: Record<string, string>;
  rendered: RenderedPrompt | null;
  busy: boolean;
  error: string | null;
}

export interface PromptCoachApi {
  state: PromptCoachState;
  templates: Ref<PromptTemplateSummary[]>;
  loading: Ref<boolean>;
  catalogError: Ref<string | null>;
  canRender: ComputedRef<boolean>;
  open(): Promise<void>;
  selectTemplate(id: string): Promise<void>;
  setInput(name: string, value: string): void;
  back(): void;
  reset(): void;
  render(): Promise<RenderedPrompt | null>;
}

function defaultsFor(inputs: PromptInputSpec[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const spec of inputs) {
    out[spec.name] = spec.default_value || "";
  }
  return out;
}

export function usePromptCoach(): PromptCoachApi {
  const catalog = usePromptLibraryCatalog();
  const state = reactive<PromptCoachState>({
    stage: "picker",
    selectedTemplate: null,
    inputValues: {},
    rendered: null,
    busy: false,
    error: null,
  });

  const canRender = computed<boolean>(() => {
    const template = state.selectedTemplate;
    if (!template) return false;
    for (const spec of template.inputs) {
      if (!spec.required) continue;
      const value = (state.inputValues[spec.name] ?? "").trim();
      if (!value) return false;
    }
    return true;
  });

  async function open(): Promise<void> {
    state.error = null;
    await catalog.ensureLoaded();
    state.stage = "picker";
  }

  async function selectTemplate(id: string): Promise<void> {
    state.busy = true;
    state.error = null;
    try {
      const detail = await getPromptTemplate(id);
      state.selectedTemplate = detail;
      state.inputValues = defaultsFor(detail.inputs);
      state.rendered = null;
      state.stage = "form";
    } catch (caught) {
      state.error = caught instanceof Error ? caught.message : String(caught);
    } finally {
      state.busy = false;
    }
  }

  function setInput(name: string, value: string): void {
    state.inputValues[name] = value;
  }

  function back(): void {
    if (state.stage === "preview") {
      state.stage = "form";
      state.rendered = null;
      return;
    }
    if (state.stage === "form") {
      state.stage = "picker";
      state.selectedTemplate = null;
      state.inputValues = {};
      return;
    }
  }

  function reset(): void {
    state.stage = "picker";
    state.selectedTemplate = null;
    state.inputValues = {};
    state.rendered = null;
    state.error = null;
  }

  async function render(): Promise<RenderedPrompt | null> {
    const template = state.selectedTemplate;
    if (!template) return null;
    state.busy = true;
    state.error = null;
    try {
      const rendered = await renderPromptTemplate(template.id, state.inputValues);
      state.rendered = rendered;
      state.stage = "preview";
      return rendered;
    } catch (caught) {
      state.error = caught instanceof Error ? caught.message : String(caught);
      return null;
    } finally {
      state.busy = false;
    }
  }

  return {
    state,
    templates: catalog.templates,
    loading: catalog.loading,
    catalogError: catalog.error,
    canRender,
    open,
    selectTemplate,
    setInput,
    back,
    reset,
    render,
  };
}
