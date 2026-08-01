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
    skillDispatch: null,
    workspaceIsolation: null,
    devShellSandbox: null,
    memory: null,
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

  it("renders the dev shell sandbox section when present", async () => {
    const wrapper = await mountCard(
      makeDiagnostics({
        devShellSandbox: {
          requested: true,
          profile: "restricted-subprocess",
          active: false,
        },
      }),
    );
    const text = wrapper.text();
    expect(text).toContain("Dev shell sandbox");
    expect(text).toContain("restricted-subprocess");
    expect(text).toContain("requested");
    expect(text).toContain("inactive");
  });

  it("renders the memory section, naming a non-durable cross-task store", async () => {
    const wrapper = await mountCard(
      makeDiagnostics({
        memory: {
          crossTaskEnabled: true,
          crossTaskDurable: false,
          patternEnabled: true,
          patternEntries: 0,
          wikiArticles: 8,
        },
      }),
    );
    const text = wrapper.text();
    expect(text).toContain("Project memory");
    expect(text).toContain("lost after this run");
    expect(text).toContain("8");
  });

  it("renders the skill dispatch section when present", async () => {
    const wrapper = await mountCard(
      makeDiagnostics({
        skillDispatch: {
          skillId: "backend-engineering",
          reason: "keyword match: api",
          dispatcher: "heuristic",
          mode: "heuristic",
        },
      }),
    );
    expect(wrapper.text()).toContain("backend-engineering");
    expect(wrapper.text()).toContain("keyword match: api");
  });

  it("shows task selector when history has multiple entries", async () => {
    setActivePinia(createPinia());
    resetRunDiagnostics();
    fetchMock.mockResolvedValue(
      makeDiagnostics({ wikiContextTier: { tier: "semantic", reason: "wiki" } }),
    );
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

describe("RunDiagnosticsCard visibility", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("renders nothing when the run produced no diagnostics and no hints", async () => {
    const wrapper = await mountCard(makeDiagnostics());
    expect(wrapper.find("section.run-diagnostics").exists()).toBe(false);
    expect(wrapper.text()).toBe("");
  });

  it("stays visible when a section is populated", async () => {
    const wrapper = await mountCard(
      makeDiagnostics({ wikiContextTier: { tier: "semantic", reason: "wiki" } }),
    );
    expect(wrapper.find("section.run-diagnostics").exists()).toBe(true);
  });

  it("stays visible when only enable hints came back", async () => {
    const wrapper = await mountCard(
      makeDiagnostics({ enableHints: { phase_loop: "turn it on" } }),
    );
    expect(wrapper.find("section.run-diagnostics").exists()).toBe(true);
  });
});

describe("RunDiagnosticsCard task selection", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("queries the selected run's own workspace, not the current run's", async () => {
    setActivePinia(createPinia());
    resetRunDiagnostics();
    fetchMock.mockResolvedValue(
      makeDiagnostics({ wikiContextTier: { tier: "semantic", reason: "wiki" } }),
    );
    const { useUiStore } = await import("@/shared/store/ui");
    const store = useUiStore();
    store.historyList.push(
      {
        taskId: "task-1",
        prompt: "current run",
        workspace_root: "/tmp/current",
      } as never,
      { taskId: "task-2", prompt: "other run", workspace_root: "/tmp/other" } as never,
    );
    const wrapper = mount(RunDiagnosticsCard, {
      props: { taskId: "task-1", workspaceRoot: "/tmp/current" },
    });
    await flushPromises();

    await wrapper.find("select.run-diagnostics__select").setValue("task-2");
    await flushPromises();

    expect(fetchMock).toHaveBeenLastCalledWith({
      taskId: "task-2",
      workspaceRoot: "/tmp/other",
    });
  });
});
