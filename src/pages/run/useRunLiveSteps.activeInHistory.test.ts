/**
 * A run that is still working shows its working step in History too.
 *
 * The active step was resolved only for the live Run page: `isHistory` forced
 * it to null, on the argument that the live `ui` store belongs to a different
 * run. True — but the snapshot's own events say which step started and never
 * finished, and that is the step in progress. Without it, opening a running
 * pipeline from History showed `dev` as pending while dev was writing
 * files (run 71a4c641).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { computed, ref } from "vue";
import { createPinia, setActivePinia } from "pinia";

import { useRunLiveSteps, type HistorySource } from "./useRunLiveSteps";
import { useUiStore } from "@/shared/store/ui";

const STEPS = ["clarify_input", "analyze_code", "dev", "qa"];

function historyOf(overrides: Partial<HistorySource> = {}): HistorySource {
  return {
    pipelineSteps: STEPS,
    events: [
      { agent: "clarify_input", status: "completed", message: "", timestamp: "" },
      { agent: "analyze_code", status: "completed", message: "", timestamp: "" },
      { agent: "dev", status: "progress", message: "", timestamp: "" },
    ] as HistorySource["events"],
    failedStep: null,
    ...overrides,
  };
}

function stepStates(source: HistorySource) {
  const rows = useRunLiveSteps({
    ui: useUiStore(),
    controller: { isRunning: ref(false) } as never,
    isRunning: computed(() => false),
    history: computed(() => source),
  } as never).stepRows.value;
  return new Map(rows.map((row) => [row.id, row.state]));
}

describe("useRunLiveSteps — a running run viewed from History", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("marks the step that started and has not finished as active", () => {
    expect(stepStates(historyOf({ runIsActive: true })).get("dev")).toBe("active");
  });

  it("leaves later steps pending", () => {
    expect(stepStates(historyOf({ runIsActive: true })).get("qa")).toBe("pending");
  });

  it("marks nothing active once the run has finished", () => {
    const states = stepStates(historyOf({ runIsActive: false }));

    expect([...states.values()]).not.toContain("active");
  });

  it("still reports a failed step as failed, not active", () => {
    const states = stepStates(
      historyOf({ runIsActive: true, failedStep: "dev" }),
    );

    expect(states.get("dev")).toBe("failed");
  });
});
