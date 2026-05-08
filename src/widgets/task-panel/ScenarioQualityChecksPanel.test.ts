import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

import ScenarioQualityChecksPanel from "@/widgets/task-panel/ScenarioQualityChecksPanel.vue";
import * as scenariosApi from "@/shared/api/endpoints/scenarios";

const SAMPLE = {
  task_id: "abc",
  scenario_id: "build_feature",
  scenario_title: "Build Feature",
  scenario_category: "development" as const,
  specs: [
    {
      id: "core_artifacts_present",
      type: "artifact_count",
      severity: "error" as const,
      blocking: true,
      config: { min: 4 },
    },
  ],
  results: [
    {
      id: "core_artifacts_present",
      type: "artifact_count",
      passed: true,
      severity: "error" as const,
      blocking: true,
      message: "5 of 6 expected artifacts present (min=4)",
    },
    {
      id: "dev_output_substantive",
      type: "agent_output_min_chars",
      passed: false,
      severity: "error" as const,
      blocking: false,
      message: "Agent 'dev' produced 50 chars (min=200)",
    },
  ],
  summary: { total: 2, passed: 1, failed: 1, blocking_failed: [] },
};

describe("ScenarioQualityChecksPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("ailouros.locale", "en");
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hides when scenarioId is null", () => {
    const wrapper = mount(ScenarioQualityChecksPanel, {
      props: { taskId: "abc", scenarioId: null, taskStatus: "completed" },
      global: { plugins: [createPinia()] },
    });
    expect(wrapper.find(".quality-checks").exists()).toBe(false);
  });

  it("does not fetch while running", async () => {
    const spy = vi
      .spyOn(scenariosApi, "getScenarioQualityChecks")
      .mockResolvedValue(SAMPLE);
    mount(ScenarioQualityChecksPanel, {
      props: {
        taskId: "abc",
        scenarioId: "build_feature",
        taskStatus: "running",
      },
      global: { plugins: [createPinia()] },
    });
    await flushPromises();
    expect(spy).not.toHaveBeenCalled();
  });

  it("renders pass/fail rows after task finishes", async () => {
    vi.spyOn(scenariosApi, "getScenarioQualityChecks").mockResolvedValue(SAMPLE);
    const wrapper = mount(ScenarioQualityChecksPanel, {
      props: {
        taskId: "abc",
        scenarioId: "build_feature",
        taskStatus: "completed",
      },
      global: { plugins: [createPinia()] },
    });
    await flushPromises();
    expect(wrapper.text()).toContain("Quality checks");
    expect(wrapper.text()).toContain("1 of 2 passed");
    const items = wrapper.findAll(".quality-checks__item");
    expect(items).toHaveLength(2);
    expect(items[0].classes()).toContain("quality-checks__item--pass");
    expect(items[1].classes()).toContain("quality-checks__item--fail");
  });

  it("marks blocking failed item with extra outline", async () => {
    vi.spyOn(scenariosApi, "getScenarioQualityChecks").mockResolvedValue({
      ...SAMPLE,
      results: [
        {
          id: "core_artifacts_present",
          type: "artifact_count",
          passed: false,
          severity: "error",
          blocking: true,
          message: "blocking failure",
        },
      ],
      summary: {
        total: 1,
        passed: 0,
        failed: 1,
        blocking_failed: ["core_artifacts_present"],
      },
    });
    const wrapper = mount(ScenarioQualityChecksPanel, {
      props: {
        taskId: "abc",
        scenarioId: "build_feature",
        taskStatus: "completed",
      },
      global: { plugins: [createPinia()] },
    });
    await flushPromises();
    const item = wrapper.find(".quality-checks__item");
    expect(item.classes()).toContain("quality-checks__item--blocking");
    expect(wrapper.text()).toContain("blocking");
  });

  it("surfaces error message when api fails", async () => {
    vi.spyOn(scenariosApi, "getScenarioQualityChecks").mockRejectedValue(
      new Error("HTTP 500"),
    );
    const wrapper = mount(ScenarioQualityChecksPanel, {
      props: {
        taskId: "abc",
        scenarioId: "build_feature",
        taskStatus: "completed",
      },
      global: { plugins: [createPinia()] },
    });
    await flushPromises();
    expect(wrapper.find(".quality-checks__error").text()).toContain("HTTP 500");
  });
});
