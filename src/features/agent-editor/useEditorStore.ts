import { ref, computed } from "vue";
import type {
  PipelineDefinition,
  PipelineNode,
  PipelineEdge,
  TriggerConfig,
  AgentConfig,
  ConditionConfig,
  ToolConfig,
} from "./types";
import {
  createPipelineDefinition,
  deletePipelineDefinition,
  getPipelineDefinition,
  listPipelineDefinitions,
  type PipelineDefinitionDto,
  type PipelineListItemDto,
  updatePipelineDefinition,
} from "@/shared/api/endpoints/pipelines-admin";

const pipeline = ref<PipelineDefinition>({
  name: "New Pipeline",
  nodes: [],
  edges: [],
});
const selectedNodeId = ref<string | null>(null);
const saving = ref(false);
const saveError = ref<string | null>(null);
const savedPipelines = ref<PipelineListItemDto[]>([]);
const listLoading = ref(false);
const listError = ref<string | null>(null);

export function useEditorStore() {
  const selectedNode = computed(
    () => pipeline.value.nodes.find((n) => n.id === selectedNodeId.value) ?? null,
  );

  function addNode(
    type: PipelineNode["type"],
    position: { x: number; y: number },
  ): PipelineNode {
    const id = `node-${Date.now()}`;
    const baseConfig = defaultConfig(type);
    const taggedConfig = {
      ...(baseConfig as Record<string, unknown>),
      official: false,
    };
    const node: PipelineNode = {
      id,
      type,
      config: taggedConfig,
      position,
    };
    pipeline.value = { ...pipeline.value, nodes: [...pipeline.value.nodes, node] };
    return node;
  }

  function updateNode(id: string, patch: Partial<PipelineNode>): void {
    pipeline.value = {
      ...pipeline.value,
      nodes: pipeline.value.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    };
  }

  function removeNode(id: string): void {
    pipeline.value = {
      ...pipeline.value,
      nodes: pipeline.value.nodes.filter((n) => n.id !== id),
      edges: pipeline.value.edges.filter((e) => e.source !== id && e.target !== id),
    };
    if (selectedNodeId.value === id) selectedNodeId.value = null;
  }

  function addEdge(source: string, target: string): void {
    const id = `edge-${source}-${target}`;
    if (pipeline.value.edges.some((e) => e.id === id)) return;
    pipeline.value = {
      ...pipeline.value,
      edges: [...pipeline.value.edges, { id, source, target }],
    };
  }

  function removeEdge(id: string): void {
    pipeline.value = {
      ...pipeline.value,
      edges: pipeline.value.edges.filter((e) => e.id !== id),
    };
  }

  function selectNode(id: string | null): void {
    selectedNodeId.value = id;
  }

  function loadPipeline(def: PipelineDefinition): void {
    pipeline.value = def;
    selectedNodeId.value = null;
  }

  async function savePipeline(): Promise<PipelineDefinition | null> {
    saving.value = true;
    saveError.value = null;
    try {
      const isNew = !pipeline.value.id;
      const payload = {
        name: pipeline.value.name,
        nodes: pipeline.value.nodes,
        edges: pipeline.value.edges,
      };
      const saved = isNew
        ? await createPipelineDefinition(payload)
        : await updatePipelineDefinition(pipeline.value.id!, payload);
      const normalized = fromDto(saved);
      pipeline.value = normalized;
      return normalized;
    } catch (e) {
      saveError.value = e instanceof Error ? e.message : String(e);
      return null;
    } finally {
      saving.value = false;
    }
  }

  async function refreshSavedPipelines(): Promise<void> {
    listLoading.value = true;
    listError.value = null;
    try {
      savedPipelines.value = await listPipelineDefinitions();
    } catch (e) {
      listError.value = e instanceof Error ? e.message : String(e);
    } finally {
      listLoading.value = false;
    }
  }

  async function loadPipelineById(
    pipelineId: string,
  ): Promise<PipelineDefinition | null> {
    listError.value = null;
    try {
      const dto = await getPipelineDefinition(pipelineId);
      const normalized = fromDto(dto);
      loadPipeline(normalized);
      return normalized;
    } catch (e) {
      listError.value = e instanceof Error ? e.message : String(e);
      return null;
    }
  }

  async function deletePipelineById(pipelineId: string): Promise<boolean> {
    listError.value = null;
    try {
      await deletePipelineDefinition(pipelineId);
      savedPipelines.value = savedPipelines.value.filter((p) => p.id !== pipelineId);
      if (pipeline.value.id === pipelineId) {
        pipeline.value = { name: "New Pipeline", nodes: [], edges: [] };
        selectedNodeId.value = null;
      }
      return true;
    } catch (e) {
      listError.value = e instanceof Error ? e.message : String(e);
      return false;
    }
  }

  return {
    pipeline,
    selectedNode,
    selectedNodeId,
    saving,
    saveError,
    savedPipelines,
    listLoading,
    listError,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    selectNode,
    loadPipeline,
    savePipeline,
    refreshSavedPipelines,
    loadPipelineById,
    deletePipelineById,
  };
}

function fromDto(dto: PipelineDefinitionDto): PipelineDefinition {
  return {
    id: dto.id,
    name: dto.name,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
    nodes: dto.nodes as PipelineNode[],
    edges: dto.edges as PipelineEdge[],
  };
}

function defaultConfig(type: PipelineNode["type"]): PipelineNode["config"] {
  switch (type) {
    case "trigger":
      return { triggerType: "manual" } satisfies TriggerConfig;
    case "agent":
      return {
        name: "Agent",
        model: "qwen2.5-coder:14b",
        role: "",
        tools: [],
        maxSteps: 10,
        temperature: 0.7,
        memoryNamespace: "",
      } satisfies AgentConfig;
    case "condition":
      return { fieldPath: "", operator: "==", value: "" } satisfies ConditionConfig;
    case "tool":
      return { toolName: "web_search" } satisfies ToolConfig;
    case "aggregator":
    case "output":
      return {};
    default: {
      void (type satisfies never);
      return {};
    }
  }
}
