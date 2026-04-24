import { fetchJson } from "@/shared/api/client";

export interface MemoryEntry {
  text: string;
  namespace?: string;
  key?: string;
  source?: string;
  timestamp?: string;
}

export async function listMemoryNotes(): Promise<{
  entries?: MemoryEntry[];
  error?: string;
}> {
  return fetchJson<{ entries?: MemoryEntry[]; error?: string }>("/v1/memory/notes");
}

export async function createMemoryNote(text: string, source: string): Promise<void> {
  await fetchJson<{ ok: boolean }>("/v1/memory/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source }),
  });
}

export async function deleteMemoryNote(index: number): Promise<void> {
  await fetchJson<{ ok: boolean }>(`/v1/memory/notes/${index}`, { method: "DELETE" });
}

export async function consolidateMemoryNotes(): Promise<{
  status?: string;
  entries_processed?: number;
  error?: string;
}> {
  return fetchJson<{ status?: string; entries_processed?: number; error?: string }>(
    "/v1/memory/consolidate",
    { method: "POST" },
  );
}
