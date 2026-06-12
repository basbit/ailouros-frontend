import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

import type { RunDiagnostics } from "@/entities/run-diagnostics";
import RunDiagnosticsCard from "./RunDiagnosticsCard.vue";
import { resetRunDiagnostics } from "@/features/run-diagnostics/useRunDiagnostics";

const fetchMock = vi.fn();

vi.mock("@/shared/api/endpoints/run-diagnostics", () => ({
  getRunDiagnostics: (input: unknown) => fetchMock(input),
}));

function makeDiagnostics(overrides: Partial<RunDiagnostics> = {}): RunDiagnostics {
  return {
    taskId: "task-1",
    phaseLoop: null,
    wikiContextTier: null,
    entailmentVerdict: null,
    citation: null,
    ragasMetrics: null,
    enableHints: {},
    ...overrides,
  };
}

async function mountCard(diagnostics: RunDiagnostics | null) {
  setActivePinia(createPinia());
  resetRunDiagnostics();
  if (diagnostics === null) {
    fetchMock.mockResolvedValue(makeDiagnostics());
  } else {
    fetchMock.mockResolvedValue(diagnostics);
  }
  const wrapper = mount(RunDiagnosticsCard, {
    props: { taskId: "task-1", workspaceRoot: "/tmp/work" },
  });
  await flushPromises();
  return wrapper;
}

describe("RunDiagnosticsCard", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("renders ragas_metrics section when payload present", async () => {
    const wrapper = await mountCard(
      makeDiagnostics({
        ragasMetrics: {
          scores: {
            faithfulness: { score: 0.85, reason: "strong overlap" },
            answer_relevancy: { score: 0.72, reason: "" },
          },
        },
      }),
    );
    const text = wrapper.text();
    expect(text).toContain("Ragas");
    expect(text).toContain("faithfulness");
    expect(text).toContain("0.85");
    expect(text).toContain("strong overlap");
  });

  it("renders enable_hints block with localized hint when section missing", async () => {
    const wrapper = await mountCard(
      makeDiagnostics({
        enableHints: {
          phase_loop: "raw english hint that should be replaced",
        },
      }),
    );
    const text = wrapper.text();
    expect(text).toContain("Enable hints");
    expect(text).toContain("phase_loop");
    expect(text).toContain("SWARM_ORCHESTRATION_PHASE_LOOP_AUTO_ADVANCE");
  });

  it("hides enable_hints block when all sections populated", async () => {
    const populated = makeDiagnostics({
      phaseLoop: {
        scenario: "default",
        currentPhase: "verify",
        history: [],
      },
      wikiContextTier: { tier: "semantic", reason: "wiki" },
      entailmentVerdict: { verdict: "entailment", score: 0.9, reason: "" },
      citation: {
        nodes: [
          {
            node: "dev_output",
            data: {
              mode: "soft",
              accepted: true,
              coverageScore: 1.0,
              citedClaims: 1,
              totalClaims: 1,
              violations: 0,
            },
          },
        ],
      },
      ragasMetrics: {
        scores: { faithfulness: { score: 0.9, reason: "" } },
      },
      enableHints: {
        phase_loop: "should not render — section populated",
      },
    });
    const wrapper = await mountCard(populated);
    expect(wrapper.text()).not.toContain("Enable hints");
  });

  it("shows task selector when history has multiple entries", async () => {
    setActivePinia(createPinia());
    resetRunDiagnostics();
    fetchMock.mockResolvedValue(makeDiagnostics());
    const { useUiStore } = await import("@/shared/store/ui");
    const store = useUiStore();
    store.historyList.push(
      {
        taskId: "task-1",
        prompt: "first task prompt",
        workspace_root: "/tmp/a",
      } as never,
      {
        taskId: "task-2",
        prompt: "second task",
        workspace_root: "/tmp/a",
      } as never,
    );
    const wrapper = mount(RunDiagnosticsCard, {
      props: { taskId: "task-1", workspaceRoot: "/tmp/work" },
    });
    await flushPromises();
    expect(wrapper.find("select.run-diagnostics__select").exists()).toBe(true);
    expect(wrapper.findAll("option")).toHaveLength(2);
  });
});
