/**
 * The status "family" (the pill colour, and what the Awaiting filter keeps)
 * must use the one shared awaiting list: a shell-gate pause is a question
 * just as much as an awaiting_human one.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/shared/lib/i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));
vi.mock("@/shared/api/http", () => ({ httpGet: vi.fn() }));

import { useUiStore, type HistoryEntry } from "@/shared/store/ui";
import { useHistoryListActions } from "./useHistoryListActions";

function entry(overrides: Partial<HistoryEntry>): HistoryEntry {
  return {
    id: overrides.taskId ?? "e",
    at: 1,
    prompt: "p",
    agent_config: null,
    pipeline_steps: [],
    taskId: "t",
    status: "completed",
    ...overrides,
  } as HistoryEntry;
}

describe("useHistoryListActions — every gate pause is one family", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it.each(["awaiting_human", "awaiting_shell_confirm", "awaiting_manual_shell"] as const)(
    "marks %s as awaiting (warn)",
    (status) => {
      const actions = useHistoryListActions();
      expect(actions.statusFamily(status)).toBe("warn");
    },
  );

  it("keeps all three under the Awaiting filter and drops a finished run", () => {
    const ui = useUiStore();
    ui.historyList = [
      entry({ taskId: "a", status: "awaiting_human" }),
      entry({ taskId: "b", status: "awaiting_shell_confirm" }),
      entry({ taskId: "c", status: "awaiting_manual_shell" }),
      entry({ taskId: "d", status: "completed" }),
    ];
    const actions = useHistoryListActions();
    actions.statusFilter.value = "awaiting";

    expect(actions.filteredEntries.value.map((row) => row.taskId)).toEqual(["a", "b", "c"]);
  });
});
