import { ref, type Ref } from "vue";
import { getWikiGraph } from "@/shared/api/endpoints/wiki";

export interface GraphNode {
  id: string;
  title: string;
  tags: string[];
  color: string;
  size: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function useGraphData(): {
  data: Ref<GraphData | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  fetch: (workspaceRoot?: string, force?: boolean) => Promise<void>;
} {
  const data = ref<GraphData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchGraph(workspaceRoot = "", force = false): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const json = await getWikiGraph(workspaceRoot, force);
      data.value = {
        nodes: json.nodes ?? [],
        edges: json.edges ?? [],
      };
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  return { data, loading, error, fetch: fetchGraph };
}
