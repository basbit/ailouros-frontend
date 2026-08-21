import { ref } from "vue";
import type { Ref } from "vue";
import { initApiBase } from "@/shared/api/base";
import {
  getRetrievalTrace,
  listRetrievalTraces,
} from "@/shared/api/endpoints/retrieval-traces";
import type {
  RetrievalTraceDetail,
  RetrievalTraceSummary,
} from "@/shared/model/retrieval-trace-types";

export interface RetrievalTraceInspectorApi {
  summaries: Ref<RetrievalTraceSummary[]>;
  selected: Ref<RetrievalTraceDetail | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  reload(workspaceRoot: string): Promise<void>;
  open(workspaceRoot: string, traceId: string): Promise<void>;
  closeSelected(): void;
  asGoldenJsonl(detail: RetrievalTraceDetail | null): string;
}

export function useRetrievalTraceInspector(): RetrievalTraceInspectorApi {
  const summaries = ref<RetrievalTraceSummary[]>([]);
  const selected = ref<RetrievalTraceDetail | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function reload(workspaceRoot: string): Promise<void> {
    const trimmed = (workspaceRoot ?? "").trim();
    if (!trimmed) {
      error.value = "workspace_root is required";
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      await initApiBase();
      const response = await listRetrievalTraces(trimmed);
      summaries.value = response.traces ?? [];
    } catch (caught) {
      summaries.value = [];
      error.value = caught instanceof Error ? caught.message : String(caught);
    } finally {
      loading.value = false;
    }
  }

  async function open(workspaceRoot: string, traceId: string): Promise<void> {
    const trimmed = (workspaceRoot ?? "").trim();
    if (!trimmed || !traceId) {
      error.value = "workspace_root and trace_id are required";
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      await initApiBase();
      selected.value = await getRetrievalTrace(trimmed, traceId);
    } catch (caught) {
      selected.value = null;
      error.value = caught instanceof Error ? caught.message : String(caught);
    } finally {
      loading.value = false;
    }
  }

  function closeSelected(): void {
    selected.value = null;
  }

  function asGoldenJsonl(detail: RetrievalTraceDetail | null): string {
    if (!detail) return "";
    const expected = detail.final_candidate_ids.slice(0, 3);
    const record = {
      query: detail.query,
      expected_chunk_ids: expected,
      required_substrings: [],
      scenario: "user-traced",
      kind: detail.final_verdict === "ok" ? "positive" : "adversarial",
    };
    return JSON.stringify(record);
  }

  return {
    summaries,
    selected,
    loading,
    error,
    reload,
    open,
    closeSelected,
    asGoldenJsonl,
  };
}
