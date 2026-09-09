export interface TaskBudgetInfo {
  task_id: string;
  budget_usd: number;
  consumed_usd: number;
  remaining_usd: number;
  max_tokens: number;
  consumed_tokens: number;
  remaining_tokens: number;
  is_warning: boolean;
  is_exhausted: boolean;
}

export function parseTaskBudgetPayload(raw: unknown): TaskBudgetInfo | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const data = raw as Record<string, unknown>;
  return {
    task_id: String(data.task_id ?? ""),
    budget_usd: Number(data.budget_usd ?? 0),
    consumed_usd: Number(data.consumed_usd ?? 0),
    remaining_usd: Number(data.remaining_usd ?? -1),
    max_tokens: Number(data.max_tokens ?? 0),
    consumed_tokens: Number(data.consumed_tokens ?? 0),
    remaining_tokens: Number(data.remaining_tokens ?? 0),
    is_warning: Boolean(data.is_warning),
    is_exhausted: Boolean(data.is_exhausted),
  };
}
