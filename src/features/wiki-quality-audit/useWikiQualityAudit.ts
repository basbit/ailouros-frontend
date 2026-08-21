import { ref } from "vue";
import type { Ref } from "vue";
import { initApiBase } from "@/shared/api/base";
import { getWikiQualityReport } from "@/shared/api/endpoints/wiki-quality";
import type { WikiQualityReport } from "@/shared/model/wiki-quality-types";

export interface WikiQualityAuditApi {
  report: Ref<WikiQualityReport | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  run(workspaceRoot: string): Promise<void>;
  clear(): void;
}

export function useWikiQualityAudit(): WikiQualityAuditApi {
  const report = ref<WikiQualityReport | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function run(workspaceRoot: string): Promise<void> {
    const trimmed = (workspaceRoot ?? "").trim();
    if (!trimmed) {
      error.value = "workspace_root is required";
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      await initApiBase();
      report.value = await getWikiQualityReport(trimmed);
    } catch (caught) {
      report.value = null;
      error.value = caught instanceof Error ? caught.message : String(caught);
    } finally {
      loading.value = false;
    }
  }

  function clear(): void {
    report.value = null;
    error.value = null;
  }

  return { report, loading, error, run, clear };
}
