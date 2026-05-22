import { ref } from "vue";
import type { Ref } from "vue";
import { getScenario, validateScenarioPayload } from "@/shared/api/endpoints/scenarios";
import type { ScenarioSummary } from "@/shared/model/scenario-types";
import { useEditorStore } from "./useEditorStore";
import type { PipelineDefinition, PipelineEdge, PipelineNode } from "./types";

const CUSTOM_STEP_PREFIX = "crole_";
const NODE_X_STEP = 220;
const NODE_Y_BASE = 120;

type ScenarioEditorMode = "official" | "custom" | "imported";

export interface ScenarioGraphConversion {
  loadScenarioIntoEditor(id: string): Promise<void>;
  duplicateLoadedAsCustom(): void;
  exportToScenarioJson(): string;
  importFromScenarioJson(raw: string): Promise<void>;
  loadedScenarioId: Ref<string | null>;
  loadedScenarioMode: Ref<ScenarioEditorMode | null>;
  loadError: Ref<string | null>;
  importError: Ref<string | null>;
}

const loadedScenarioId = ref<string | null>(null);
const loadedScenarioMode = ref<ScenarioEditorMode | null>(null);
const loadError = ref<string | null>(null);
const importError = ref<string | null>(null);

function isCustomStepId(stepId: string): boolean {
  return stepId.startsWith(CUSTOM_STEP_PREFIX);
}

function scenarioToPipelineDefinition(scenario: ScenarioSummary): PipelineDefinition {
  const nodes: PipelineNode[] = scenario.pipeline_steps.map((step, index) => ({
    id: step,
    type: isCustomStepId(step) ? "tool" : "agent",
    config: {
      name: step,
      stepId: step,
      official: !isCustomStepId(step),
    },
    position: { x: NODE_X_STEP * index + 40, y: NODE_Y_BASE },
  }));
  const edges: PipelineEdge[] = [];
  for (let index = 1; index < scenario.pipeline_steps.length; index += 1) {
    const source = scenario.pipeline_steps[index - 1];
    const target = scenario.pipeline_steps[index];
    edges.push({ id: `edge-${source}-${target}`, source, target });
  }
  return {
    name: scenario.title,
    nodes,
    edges,
  };
}

function pipelineToScenarioJson(
  pipeline: PipelineDefinition,
  scenarioId: string,
): string {
  const stepIds = pipeline.nodes.map((node) => node.id);
  const payload = {
    id: scenarioId,
    title: pipeline.name || scenarioId,
    category: "development",
    description: pipeline.name || scenarioId,
    pipeline_steps: stepIds,
    default_gates: [],
    expected_artifacts: [],
    required_tools: [],
    workspace_write_default: false,
    recommended_models: {},
    tags: [],
    quality_checks: [],
    inputs: [],
    agent_config_defaults: {},
  };
  return JSON.stringify(payload, null, 2);
}

export function useScenarioGraphIntegration(): ScenarioGraphConversion {
  const editor = useEditorStore();

  async function loadScenarioIntoEditor(id: string): Promise<void> {
    loadError.value = null;
    try {
      const scenario = await getScenario(id);
      const definition = scenarioToPipelineDefinition(scenario);
      editor.loadPipeline(definition);
      loadedScenarioId.value = scenario.id;
      loadedScenarioMode.value = "official";
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : String(failure);
      loadError.value = message;
      throw failure;
    }
  }

  function duplicateLoadedAsCustom(): void {
    if (!loadedScenarioId.value) {
      return;
    }
    const stamp = Date.now();
    const newId = `${loadedScenarioId.value}_copy_${stamp}`;
    editor.pipeline.value = {
      ...editor.pipeline.value,
      id: undefined,
      name: newId,
    };
    loadedScenarioId.value = null;
    loadedScenarioMode.value = "custom";
  }

  function exportToScenarioJson(): string {
    const scenarioId = loadedScenarioId.value ?? "custom_workflow";
    return pipelineToScenarioJson(editor.pipeline.value, scenarioId);
  }

  async function importFromScenarioJson(raw: string): Promise<void> {
    importError.value = null;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : String(failure);
      importError.value = message;
      throw failure;
    }
    try {
      const response = await validateScenarioPayload(parsed);
      const definition = scenarioToPipelineDefinition(response.summary);
      editor.loadPipeline(definition);
      loadedScenarioId.value = response.id;
      loadedScenarioMode.value = "imported";
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : String(failure);
      importError.value = message;
      throw failure;
    }
  }

  return {
    loadScenarioIntoEditor,
    duplicateLoadedAsCustom,
    exportToScenarioJson,
    importFromScenarioJson,
    loadedScenarioId,
    loadedScenarioMode,
    loadError,
    importError,
  };
}

export function _resetScenarioGraphIntegrationForTests(): void {
  loadedScenarioId.value = null;
  loadedScenarioMode.value = null;
  loadError.value = null;
  importError.value = null;
}
