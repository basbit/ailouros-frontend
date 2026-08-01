import { httpDelete, httpGet, httpPost } from "@/shared/api/http";

type MemoryEntrySource = "note" | "pattern_memory" | "qdrant";

export interface MemoryEntry {
  text: string;
  namespace?: string;
  key?: string;
  source?: MemoryEntrySource;
  timestamp?: string;
  score?: number;
  payload?: Record<string, unknown>;
}

export async function listMemoryNotes(): Promise<{
  entries?: MemoryEntry[];
  error?: string;
}> {
  return httpGet<{ entries?: MemoryEntry[]; error?: string }>("/v1/memory/notes");
}

export async function createMemoryNote(text: string, source: string): Promise<void> {
  await httpPost<{ ok: boolean }>("/v1/memory/notes", { text, source });
}

export async function deleteMemoryNote(index: number): Promise<void> {
  await httpDelete<{ ok: boolean }>(`/v1/memory/notes/${index}`);
}

export async function consolidateMemoryNotes(): Promise<{
  status?: string;
  entries_processed?: number;
  error?: string;
}> {
  return httpPost<{ status?: string; entries_processed?: number; error?: string }>(
    "/v1/memory/consolidate",
  );
}

export async function listQdrantEntries(
  collection?: string,
  limit = 100,
): Promise<{ entries: MemoryEntry[]; collections: string[] }> {
  const params = new URLSearchParams();
  if (collection) params.set("collection", collection);
  params.set("limit", String(limit));
  return httpGet<{ entries: MemoryEntry[]; collections: string[] }>(
    `/v1/memory/qdrant?${params.toString()}`,
  );
}

export interface QuarantinedPattern {
  namespace: string;
  key: string;
  value: string;
  provenance?: Record<string, unknown>;
}

export interface QuarantinedEpisode {
  step_id?: string;
  text?: string;
  provenance?: Record<string, unknown>;
}

export async function listQuarantinedMemory(
  specId: string,
  specHash: string,
  workspaceRoot?: string,
): Promise<{
  ok: boolean;
  patterns: QuarantinedPattern[];
  episodes: QuarantinedEpisode[];
}> {
  const params = new URLSearchParams({ spec_id: specId, spec_hash: specHash });
  if (workspaceRoot) params.set("workspace_root", workspaceRoot);
  return httpGet<{
    ok: boolean;
    patterns: QuarantinedPattern[];
    episodes: QuarantinedEpisode[];
  }>(`/v1/memory/quarantine?${params.toString()}`);
}
