import { computed, type ComputedRef } from "vue";
import type { HistoryEntry } from "@/shared/store/ui";

export interface PatternMemoryHint {
  source: HistoryEntry;
  pipelineSteps: string[];
}

interface Options {
  prompt: ComputedRef<string>;
  currentPipelineSteps: ComputedRef<string[]>;
  history: ComputedRef<HistoryEntry[]>;
  dismissed: ComputedRef<Set<string>>;
  minOverlap?: number;
}

function tokenise(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 4),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function usePatternMemoryHint(options: Options) {
  const threshold = options.minOverlap ?? 0.4;

  const hint = computed<PatternMemoryHint | null>(() => {
    const prompt = options.prompt.value.trim();
    if (prompt.length < 12) return null;
    const currentTokens = tokenise(prompt);
    if (currentTokens.size < 2) return null;
    const currentSteps = options.currentPipelineSteps.value;
    const dismissed = options.dismissed.value;

    const candidates = options.history.value
      .filter(
        (entry) =>
          entry.status === "completed" || entry.status === "completed_no_writes",
      )
      .filter((entry) => !!entry.pipeline_steps?.length)
      .filter((entry) => !dismissed.has(entry.id))
      .filter((entry) => !arraysEqual(entry.pipeline_steps, currentSteps))
      .map((entry) => {
        const entryTokens = tokenise(entry.prompt ?? "");
        return { entry, score: jaccard(currentTokens, entryTokens) };
      })
      .filter((candidate) => candidate.score >= threshold)
      .sort((left, right) => right.score - left.score);

    const best = candidates[0];
    if (!best) return null;
    return {
      source: best.entry,
      pipelineSteps: best.entry.pipeline_steps,
    };
  });

  return { hint };
}
