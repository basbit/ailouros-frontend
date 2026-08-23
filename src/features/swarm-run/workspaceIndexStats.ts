import { readonly, ref } from "vue";

export interface WorkspaceIndexStats {
  total_files: number;
  omitted_files: number;
  total_chars: number;
  limit_paths: number;
  limit_chars: number;
  omitted_large: number;
  omitted_suffix: number;
  truncated_paths: number;
  truncated_chars: number;
}

const HISTORY_MAX_ENTRIES = 12;

const latestStats = ref<WorkspaceIndexStats | null>(null);
const historyStats = ref<WorkspaceIndexStats[]>([]);

function asInt(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

export function recordWorkspaceIndexStats(raw: Record<string, unknown>): void {
  const stats: WorkspaceIndexStats = {
    total_files: asInt(raw.total_files),
    omitted_files: asInt(raw.omitted_files),
    total_chars: asInt(raw.total_chars),
    limit_paths: asInt(raw.limit_paths),
    limit_chars: asInt(raw.limit_chars),
    omitted_large: asInt(raw.omitted_large),
    omitted_suffix: asInt(raw.omitted_suffix),
    truncated_paths: asInt(raw.truncated_paths),
    truncated_chars: asInt(raw.truncated_chars),
  };
  if (latestStats.value) {
    historyStats.value = [latestStats.value, ...historyStats.value].slice(
      0,
      HISTORY_MAX_ENTRIES,
    );
  }
  latestStats.value = stats;
}

export function resetWorkspaceIndexStats(): void {
  latestStats.value = null;
  historyStats.value = [];
}

export const workspaceIndexLatest = readonly(latestStats);
