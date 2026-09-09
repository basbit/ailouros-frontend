import { describe, expect, it, vi, beforeEach } from "vitest";
import { useTaskBudget } from "../useTaskBudget";
import * as httpModule from "@/shared/api/http";

vi.mock("@/shared/api/http", () => ({
  httpGet: vi.fn(),
  httpPost: vi.fn(),
}));

describe("useTaskBudget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const { clear } = useTaskBudget();
    clear();
  });

  it("fetches and parses budget info", async () => {
    vi.mocked(httpModule.httpGet).mockResolvedValueOnce({
      task_id: "task-100",
      budget_usd: 2.0,
      consumed_usd: 0.5,
      remaining_usd: 1.5,
      max_tokens: 50000,
      consumed_tokens: 12000,
      remaining_tokens: 38000,
      is_warning: false,
      is_exhausted: false,
    });

    const { budget, refresh } = useTaskBudget();
    await refresh("task-100");

    expect(budget.value).not.toBeNull();
    expect(budget.value?.task_id).toBe("task-100");
    expect(budget.value?.budget_usd).toBe(2.0);
    expect(budget.value?.consumed_usd).toBe(0.5);
    expect(budget.value?.is_warning).toBe(false);
  });

  it("increases budget via post", async () => {
    vi.mocked(httpModule.httpPost).mockResolvedValueOnce({
      ok: true,
      budget: {
        task_id: "task-100",
        budget_usd: 3.0,
        consumed_usd: 0.5,
        remaining_usd: 2.5,
        max_tokens: 50000,
        consumed_tokens: 12000,
        remaining_tokens: 38000,
        is_warning: false,
        is_exhausted: false,
      },
    });

    const { budget, increaseBudget } = useTaskBudget();
    const ok = await increaseBudget("task-100", 1.0, 0);

    expect(ok).toBe(true);
    expect(budget.value?.budget_usd).toBe(3.0);
  });
});
