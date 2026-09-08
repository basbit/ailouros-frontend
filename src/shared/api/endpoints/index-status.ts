import { httpGet } from "@/shared/api/http";

export interface IndexStatus {
  readonly workspaceRoot: string;
  readonly vectorBackend: string;
  readonly collections: readonly string[];
  readonly points: number;
  readonly wiki: {
    readonly exists: boolean;
    readonly wikiFiles: number;
    readonly wikiChunks: number;
    readonly builtAt: number | null;
  };
}

interface RawPayload {
  [key: string]: unknown;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

function parseWiki(raw: unknown): IndexStatus["wiki"] {
  const candidate = raw as RawPayload;
  const builtAtValue = candidate.built_at;
  return {
    exists: Boolean(candidate.exists),
    wikiFiles: asNumber(candidate.wiki_files),
    wikiChunks: asNumber(candidate.wiki_chunks),
    builtAt:
      typeof builtAtValue === "number" && Number.isFinite(builtAtValue)
        ? builtAtValue
        : null,
  };
}

function parseIndexStatusPayload(raw: unknown): IndexStatus | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawPayload;
  return {
    workspaceRoot: asString(candidate.workspace_root),
    vectorBackend: asString(candidate.vector_backend),
    collections: readStringList(candidate.collections),
    points: asNumber(candidate.points),
    wiki: parseWiki(candidate.wiki),
  };
}

export async function getIndexStatus(
  workspaceRoot: string,
): Promise<IndexStatus | null> {
  const raw = await httpGet<Record<string, unknown>>(
    `/v1/index/status?workspace_root=${encodeURIComponent(workspaceRoot)}`,
  );
  return parseIndexStatusPayload(raw);
}
