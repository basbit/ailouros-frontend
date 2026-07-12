import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import RunLiveLog from "./RunLiveLog.vue";
import styleSource from "./RunLiveLog.vue?raw";
import type { EventRow, LogClass, LogFilter } from "./useRunLiveSteps";

// Hardcoded colors from the pre-fix dark-only palette. None of these may
// reappear in the <style> block once it switches to theme tokens.
const HARDCODED_DARK_PALETTE_COLORS = [
  "#15120e",
  "#f3ece0",
  "#f08454",
  "#87c884",
  "#b69be0",
  "#79a4d4",
  "rgba(255, 235, 200",
  "rgba(243, 236, 224",
  "rgba(225, 106, 58",
];

function mountLog() {
  return mount(RunLiveLog, {
    props: {
      filter: "all" as LogFilter,
      filterOptions: [{ key: "all" as LogFilter, label: "All" }],
      events: [] as EventRow[],
      emptyText: "No events yet",
      classify: () => "sys" as LogClass,
      formatTime: () => "00:00:00",
    },
  });
}

describe("RunLiveLog theme tokens", () => {
  it("mounts and renders the toolbar and empty state", () => {
    const wrapper = mountLog();
    expect(wrapper.find(".run-live-log").exists()).toBe(true);
    expect(wrapper.find(".run-live-log__empty").text()).toBe("No events yet");
  });

  it("styles the panel from theme tokens, not a hardcoded dark palette", () => {
    const styleBlock = styleSource.slice(styleSource.indexOf("<style"));

    expect(styleBlock).toContain("var(--bg-2)");
    expect(styleBlock).toContain("var(--ink)");
    expect(styleBlock).toContain("var(--line)");
    expect(styleBlock).toContain("var(--ink-3)");
    expect(styleBlock).toContain("var(--ink-4)");
    expect(styleBlock).toContain("var(--accent)");
    expect(styleBlock).toContain("var(--accent-soft)");
    expect(styleBlock).toContain("var(--ok)");
    expect(styleBlock).toContain("var(--review)");
    expect(styleBlock).toContain("var(--info)");
    expect(styleBlock).toContain("var(--error)");

    for (const hardcoded of HARDCODED_DARK_PALETTE_COLORS) {
      expect(styleBlock).not.toContain(hardcoded);
    }
  });
});
