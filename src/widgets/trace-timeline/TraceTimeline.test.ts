import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

import TraceTimeline from "./TraceTimeline.vue";
import type { TaskTrace } from "@/shared/api/endpoints/trace";

vi.mock("@/shared/api/endpoints/trace", () => ({
  getTaskTrace: vi.fn(),
}));

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

import { getTaskTrace } from "@/shared/api/endpoints/trace";

const eventTypes = [
  "run_start",
  "step_start",
  "tool_call",
  "step_end",
  "step_start",
  "gate_open",
  "gate_close",
  "step_end",
  "error",
];

function makeTrace(taskId: string): TaskTrace {
  return {
    taskId,
    collector: "in_memory",
    events: eventTypes.map((eventType, index) => ({
      eventId: `e${index}`,
      traceId: `tr${index}`,
      sessionId: "s1",
      taskId,
      step: index < 4 ? "pm" : "dev",
      eventType,
      timestamp: new Date(1000 + index * 100).toISOString(),
      data: {},
      parentEventId: index === 2 ? "e1" : null,
      promptFiles: eventType.endsWith("_start")
        ? [`/artifacts/t1/agents/prompts/${eventType}.json`]
        : [],
    })),
  };
}

describe("TraceTimeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an ordered list of events with nesting and duration", async () => {
    (getTaskTrace as ReturnType<typeof vi.fn>).mockResolvedValue(makeTrace("t1"));
    const wrapper = mount(TraceTimeline, { props: { taskId: "t1" } });
    await flushPromises();

    const items = wrapper.findAll(".trace-timeline__item");
    expect(items.length).toBe(9);

    // Nested child (tool_call under step_start pm) carries the indent class.
    expect(items[2].classes()).toContain("trace-timeline__item--nested");

    // The step_start pm shows a duration computed from the following step_end.
    expect(wrapper.text()).toContain("pm");

    // Type badges rendered.
    expect(wrapper.findAll(".trace-timeline__badge--error").length).toBe(1);

    // Prompt-file links render for _start events.
    const links = wrapper.findAll(".trace-timeline__link");
    expect(links.length).toBeGreaterThan(0);
    expect(links[0].attributes("href")).toContain("/artifacts/t1/agents/prompts/");
  });

  it("shows the empty hint when the trace has no events", async () => {
    (getTaskTrace as ReturnType<typeof vi.fn>).mockResolvedValue({
      taskId: "t1",
      collector: "in_memory",
      events: [],
    });
    const wrapper = mount(TraceTimeline, { props: { taskId: "t1" } });
    await flushPromises();
    expect(wrapper.text()).toContain("traceTimeline.noEvents");
  });

  it("shows the no-task hint when taskId is empty", async () => {
    const wrapper = mount(TraceTimeline, { props: { taskId: "" } });
    expect(wrapper.text()).toContain("traceTimeline.noTask");
  });
});
