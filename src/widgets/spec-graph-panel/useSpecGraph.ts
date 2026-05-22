import { ref, type Ref } from "vue";
import { ApiError } from "@/shared/api/http";
import {
  generateFromSpec,
  getSpecDrift,
  getSpecGraph,
  type SpecCodegenOutcome,
  type SpecDriftReport,
  type SpecGraphDto,
  type SpecGraphEdgeDto,
  type SpecGraphNodeDto,
} from "@/shared/api/endpoints/spec";

interface SpecGraphCanvasNode {
  id: string;
  title: string;
  tags: string[];
  color: string;
  size: number;
  kind: string;
}

interface SpecGraphCanvasEdge {
  id: string;
  source: string;
  target: string;
  kind: string;
}

interface SpecGraphCanvasData {
  nodes: SpecGraphCanvasNode[];
  edges: SpecGraphCanvasEdge[];
}

export const SPEC_NODE_PALETTE: Record<string, string> = {
  spec: "#4dabf7",
  code: "#51cf66",
  test: "#ff922b",
  prompt: "#a162e8",
};

const FALLBACK_COLOR = "#868e96";
const DEFAULT_NODE_SIZE = 10;

export interface UseSpecGraphState {
  nodes: Ref<SpecGraphCanvasNode[]>;
  edges: Ref<SpecGraphCanvasEdge[]>;
  data: Ref<SpecGraphCanvasData | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  notImplemented: Ref<boolean>;
  drift: Ref<SpecDriftReport | null>;
  driftLoading: Ref<boolean>;
  driftError: Ref<string | null>;
  codegenResult: Ref<SpecCodegenOutcome | null>;
  codegenLoading: Ref<boolean>;
  codegenError: Ref<string | null>;
  load: (workspaceRoot: string, persist?: boolean) => Promise<void>;
  loadDrift: (workspaceRoot: string) => Promise<void>;
  runCodegen: (specId: string) => Promise<void>;
  reset: () => void;
}

function pickTitle(node: SpecGraphNodeDto): string {
  const payload = node.payload ?? {};
  const title = payload["title"];
  if (typeof title === "string" && title.trim()) return title;
  const name = payload["name"];
  if (typeof name === "string" && name.trim()) return name;
  return node.id;
}

function pickColor(kind: string): string {
  return SPEC_NODE_PALETTE[kind] ?? FALLBACK_COLOR;
}

function adaptNode(node: SpecGraphNodeDto): SpecGraphCanvasNode {
  return {
    id: node.id,
    title: pickTitle(node),
    tags: [node.kind],
    color: pickColor(node.kind),
    size: DEFAULT_NODE_SIZE,
    kind: node.kind,
  };
}

function adaptEdge(edge: SpecGraphEdgeDto, index: number): SpecGraphCanvasEdge {
  return {
    id: `${edge.from}->${edge.to}#${index}`,
    source: edge.from,
    target: edge.to,
    kind: edge.kind,
  };
}

export function useSpecGraph(): UseSpecGraphState {
  const nodes = ref<SpecGraphCanvasNode[]>([]);
  const edges = ref<SpecGraphCanvasEdge[]>([]);
  const data = ref<SpecGraphCanvasData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const notImplemented = ref(false);
  const drift = ref<SpecDriftReport | null>(null);
  const driftLoading = ref(false);
  const driftError = ref<string | null>(null);
  const codegenResult = ref<SpecCodegenOutcome | null>(null);
  const codegenLoading = ref(false);
  const codegenError = ref<string | null>(null);

  async function loadDrift(workspaceRoot: string): Promise<void> {
    driftLoading.value = true;
    driftError.value = null;
    try {
      drift.value = await getSpecDrift(workspaceRoot);
    } catch (err) {
      drift.value = null;
      driftError.value = err instanceof Error ? err.message : String(err);
    } finally {
      driftLoading.value = false;
    }
  }

  async function runCodegen(specId: string): Promise<void> {
    codegenLoading.value = true;
    codegenError.value = null;
    try {
      codegenResult.value = await generateFromSpec(specId);
    } catch (err) {
      codegenResult.value = null;
      codegenError.value = err instanceof Error ? err.message : String(err);
    } finally {
      codegenLoading.value = false;
    }
  }

  async function load(workspaceRoot: string, persist = false): Promise<void> {
    loading.value = true;
    error.value = null;
    notImplemented.value = false;
    try {
      const dto: SpecGraphDto = await getSpecGraph(workspaceRoot, persist);
      const adaptedNodes = (dto.nodes ?? []).map(adaptNode);
      const adaptedEdges = (dto.edges ?? []).map(adaptEdge);
      nodes.value = adaptedNodes;
      edges.value = adaptedEdges;
      data.value = { nodes: adaptedNodes, edges: adaptedEdges };
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        notImplemented.value = true;
        nodes.value = [];
        edges.value = [];
        data.value = null;
        return;
      }
      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = "Failed to load spec graph.";
      }
    } finally {
      loading.value = false;
    }
  }

  function reset(): void {
    nodes.value = [];
    edges.value = [];
    data.value = null;
    loading.value = false;
    error.value = null;
    notImplemented.value = false;
    drift.value = null;
    driftLoading.value = false;
    driftError.value = null;
    codegenResult.value = null;
    codegenLoading.value = false;
    codegenError.value = null;
  }

  return {
    nodes,
    edges,
    data,
    loading,
    error,
    notImplemented,
    drift,
    driftLoading,
    driftError,
    codegenResult,
    codegenLoading,
    codegenError,
    load,
    loadDrift,
    runCodegen,
    reset,
  };
}
