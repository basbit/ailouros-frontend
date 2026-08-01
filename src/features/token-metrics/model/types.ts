interface StepTokens {
  readonly stepId: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly toolCalls: number;
  readonly retrievedTokens: number;
}

export interface TokenMetrics {
  readonly taskId: string;
  readonly totalInputTokens: number;
  readonly medianSmallStepInputTokens: number;
  readonly fileReadCacheHits: number;
  readonly fileReadCacheMisses: number;
  readonly fileReadCacheHitRate: number;
  readonly steps: readonly StepTokens[];
}

interface RawStepEntry {
  input_tokens?: unknown;
  output_tokens?: unknown;
  tool_calls_count?: unknown;
  retrieved_tokens?: unknown;
}

interface RawMetrics {
  total_input_tokens?: unknown;
  median_small_step_input_tokens?: unknown;
  file_read_cache_hits?: unknown;
  file_read_cache_misses?: unknown;
  file_read_cache_hit_rate?: unknown;
  step_metrics?: unknown;
}

interface RawTaskPayload {
  task_id?: unknown;
  pipeline_metrics?: unknown;
}

function readInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}

function readFloat(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return value;
}

function parseStep(stepId: string, raw: unknown): StepTokens {
  const candidate = (raw ?? {}) as RawStepEntry;
  return {
    stepId,
    inputTokens: readInt(candidate.input_tokens),
    outputTokens: readInt(candidate.output_tokens),
    toolCalls: readInt(candidate.tool_calls_count),
    retrievedTokens: readInt(candidate.retrieved_tokens),
  };
}

function parseSteps(raw: unknown): StepTokens[] {
  if (!raw || typeof raw !== "object") return [];
  const out: StepTokens[] = [];
  for (const [stepId, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (!stepId) continue;
    out.push(parseStep(stepId, entry));
  }
  return out;
}

export function parseTokenMetricsPayload(raw: unknown): TokenMetrics | null {
  if (!raw || typeof raw !== "object") return null;
  const task = raw as RawTaskPayload;
  const taskId = typeof task.task_id === "string" ? task.task_id : "";
  if (!taskId) return null;
  // A task with no metrics yet must read as "no data", not as a measured zero:
  // during a run the backend has nothing to report until the first step is
  // recorded, and zero-filling that made the panel look permanently broken.
  const rawMetrics = task.pipeline_metrics;
  if (!rawMetrics || typeof rawMetrics !== "object" || Array.isArray(rawMetrics))
    return null;
  const metrics = rawMetrics as RawMetrics;
  return {
    taskId,
    totalInputTokens: readInt(metrics.total_input_tokens),
    medianSmallStepInputTokens: readInt(metrics.median_small_step_input_tokens),
    fileReadCacheHits: readInt(metrics.file_read_cache_hits),
    fileReadCacheMisses: readInt(metrics.file_read_cache_misses),
    fileReadCacheHitRate: readFloat(metrics.file_read_cache_hit_rate),
    steps: parseSteps(metrics.step_metrics),
  };
}
