import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import HistoryListTable from "../HistoryListTable.vue";
import type { HistoryEntry } from "@/shared/store/ui";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, vars?: Record<string, unknown>) =>
      vars ? `${key}:${JSON.stringify(vars)}` : key,
  }),
}));

function entry(overrides: Partial<HistoryEntry>): HistoryEntry {
  return {
    id: "e-1",
    at: 1,
    prompt: "build the thing",
    agent_config: null,
    pipeline_steps: ["pm", "dev"],
    taskId: "task-1",
    status: "completed",
    ...overrides,
  } as HistoryEntry;
}

function mountTable(entries: HistoryEntry[]) {
  return mount(HistoryListTable, {
    props: {
      entries,
      resumeBusyId: "",
      statusFamily: () => "ok",
      canResume: () => false,
    },
  });
}

describe("HistoryListTable fork lineage", () => {
  it("marks a forked run so it is not mistaken for an original", () => {
    const wrapper = mountTable([
      entry({ id: "e-fork", parentTaskId: "task-1", forkedFromStep: "dev" }),
    ]);

    const badge = wrapper.find(".history-list-table__fork");
    expect(badge.exists()).toBe(true);
    expect(badge.attributes("title")).toContain("task-1");
    expect(badge.attributes("title")).toContain("dev");
  });

  it("shows no fork badge on an original run", () => {
    const wrapper = mountTable([entry({ id: "e-orig" })]);

    expect(wrapper.find(".history-list-table__fork").exists()).toBe(false);
  });

  it("shows question badge on awaiting_human runs", () => {
    const wrapper = mountTable([
      entry({ id: "e-awaiting", taskId: "task-2", status: "awaiting_human" }),
    ]);

    const mark = wrapper.find(".history-list-table__gate-mark");
    expect(mark.exists()).toBe(true);
    expect(mark.text()).toBe("❓");
    expect(mark.attributes("aria-label")).toBe("history.questionBadge");
    expect(wrapper.find(".history-list-table__pill").text()).toContain("awaiting_human");
  });

  it("shows no question badge on completed runs", () => {
    const wrapper = mountTable([
      entry({ id: "e-done", taskId: "task-3", status: "completed" }),
    ]);

    expect(wrapper.find(".history-list-table__gate-mark").exists()).toBe(false);
  });
});
