import { computed, readonly, ref, type Ref } from "vue";

import type { ResolvedCitation } from "@/entities/resolved-citation";
import { resolveCitation } from "@/shared/api/endpoints/citations";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const HISTORY_MAX_ENTRIES = 32;

const resolvedCache = new Map<string, ResolvedCitation>();
const inFlightRequests = new Map<string, Promise<ResolvedCitation>>();
const resolvedHistory = ref<ResolvedCitation[]>([]);
const lastError = ref<string | null>(null);

export function resetInlineCitationsCache(): void {
  resolvedCache.clear();
  inFlightRequests.clear();
  resolvedHistory.value = [];
  lastError.value = null;
}

function buildCacheKey(chunkId: string, workspaceRoot: string | null): string {
  return `${workspaceRoot ?? ""}::${chunkId}`;
}

function recordHistory(citation: ResolvedCitation): void {
  const next = resolvedHistory.value.filter(
    (entry) => entry.chunkId !== citation.chunkId,
  );
  next.unshift(citation);
  resolvedHistory.value = next.slice(0, HISTORY_MAX_ENTRIES);
}

interface InlineCitationsOptions {
  workspaceRoot?: Ref<string | null>;
}

export function useInlineCitations(options: InlineCitationsOptions = {}) {
  const workspaceRoot = options.workspaceRoot ?? ref<string | null>(null);

  async function resolve(chunkId: string): Promise<ResolvedCitation | null> {
    const trimmedChunkId = chunkId.trim();
    if (!trimmedChunkId) return null;
    const cacheKey = buildCacheKey(trimmedChunkId, workspaceRoot.value);
    const cached = resolvedCache.get(cacheKey);
    if (cached) return cached;
    const existing = inFlightRequests.get(cacheKey);
    if (existing) return existing;
    const request = resolveCitation({
      chunkId: trimmedChunkId,
      workspaceRoot: workspaceRoot.value,
    })
      .then((citation) => {
        resolvedCache.set(cacheKey, citation);
        recordHistory(citation);
        return citation;
      })
      .catch((requestError: unknown) => {
        const message =
          requestError instanceof Error ? requestError.message : String(requestError);
        frontendLogger.warn("inline-citations: resolve failed", {
          chunkId: trimmedChunkId,
          error: message,
        });
        lastError.value = message;
        throw requestError;
      })
      .finally(() => {
        inFlightRequests.delete(cacheKey);
      });
    inFlightRequests.set(cacheKey, request);
    try {
      return await request;
    } catch {
      return null;
    }
  }

  return {
    resolve,
    history: readonly(resolvedHistory),
    visible: computed(() => resolvedHistory.value.length > 0),
    lastError: readonly(lastError),
  };
}
