import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";

import ToolActivityPanel from "./ToolActivityPanel.vue";

vi.mock("@/shared/api/endpoints/activity", () => ({
  getActivityTail: vi.fn(),
}));

import { getActivityTail } from "@/shared/api/endpoints/activity";

const mockedGetActivityTail = vi.mocked(getActivityTail);

describe("ToolActivityPanel", () => {
  beforeEach(() => {
    mockedGetActivityTail.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a 'no task selected' hint when taskId is null", async () => {
    const wrapper = mount(ToolActivityPanel, { props: { taskId: null } });
    await flushPromises();
    expect(wrapper.text()).toContain("no task selected");
    expect(mockedGetActivityTail).not.toHaveBeenCalled();
  });

  it("renders mcp entries when taskId is provided", async () => {
    mockedGetActivityTail.mockResolvedValue({
      task_id: "t1",
      channel: "mcp_calls",
      limit: 100,
      count: 1,
      entries: [
        {
          ts: "2026-05-15T10:00:00.000Z",
          channel: "mcp_calls",
          task_id: "t1",
          server: "workspace",
          tool: "read",
          status: "ok",
          elapsed_ms: 42,
        },
      ],
    });
    const wrapper = mount(ToolActivityPanel, {
      props: { taskId: "t1", pollIntervalMs: 9999999 },
    });
    await flushPromises();
    expect(wrapper.text()).toContain("workspace.read → ok 42ms");
  });

  it("switches channel when chip clicked", async () => {
    mockedGetActivityTail.mockResolvedValue({
      task_id: "t1",
      channel: "web_searches",
      limit: 100,
      count: 1,
      entries: [
        {
          ts: "2026-05-15T10:00:00.000Z",
          channel: "web_searches",
          task_id: "t1",
          provider: "tavily",
          query: "opus",
          status: "ok",
          hit_count: 3,
        },
      ],
    });
    const wrapper = mount(ToolActivityPanel, {
      props: { taskId: "t1", pollIntervalMs: 9999999 },
    });
    await flushPromises();
    const chips = wrapper.findAll(".tool-activity__chip");
    const webChip = chips.find((c) => c.text() === "Web");
    await webChip!.trigger("click");
    await flushPromises();
    expect(mockedGetActivityTail).toHaveBeenLastCalledWith(
      "t1",
      "web_searches",
      100,
      expect.anything(),
    );
    expect(wrapper.text()).toContain("tavily opus → ok 3 hits");
  });

  it("renders error message when API rejects", async () => {
    mockedGetActivityTail.mockRejectedValue(new Error("boom"));
    const wrapper = mount(ToolActivityPanel, {
      props: { taskId: "t1", pollIntervalMs: 9999999 },
    });
    await flushPromises();
    expect(wrapper.text()).toContain("boom");
  });
});
