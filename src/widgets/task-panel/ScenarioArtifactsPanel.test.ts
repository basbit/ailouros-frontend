import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

import ScenarioArtifactsPanel from "@/widgets/task-panel/ScenarioArtifactsPanel.vue";
import * as scenariosApi from "@/shared/api/endpoints/scenarios";

const SAMPLE = {
  task_id: "abc",
  scenario_id: "code_review",
  scenario_title: "Code Review",
  scenario_category: "code_quality" as const,
  expected_artifacts: ["pipeline.json", "agents/x.txt"],
  status: [
    {
      path: "pipeline.json",
      present: true,
      size: 12,
      mtime: 1.0,
      url: "/artifacts/abc/pipeline.json",
    },
    {
      path: "agents/x.txt",
      present: false,
      size: null,
      mtime: null,
      url: null,
    },
  ],
  summary: { present: 1, missing: 1, total: 2 },
};

describe("ScenarioArtifactsPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("ailouros.locale", "en");
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hides itself when no taskId or scenarioId", () => {
    const wrapper = mount(ScenarioArtifactsPanel, {
      props: { taskId: null, scenarioId: null, taskStatus: "completed" },
      global: { plugins: [createPinia()] },
    });
    expect(wrapper.find(".scenario-artifacts").exists()).toBe(false);
  });

  it("hides when scenarioId is null", () => {
    const wrapper = mount(ScenarioArtifactsPanel, {
      props: { taskId: "abc", scenarioId: null, taskStatus: "completed" },
      global: { plugins: [createPinia()] },
    });
    expect(wrapper.find(".scenario-artifacts").exists()).toBe(false);
  });

  it("does not fetch while task is still running", async () => {
    const spy = vi
      .spyOn(scenariosApi, "getScenarioArtifacts")
      .mockResolvedValue(SAMPLE);
    mount(ScenarioArtifactsPanel, {
      props: { taskId: "abc", scenarioId: "code_review", taskStatus: "running" },
      global: { plugins: [createPinia()] },
    });
    await flushPromises();
    expect(spy).not.toHaveBeenCalled();
  });

  it("fetches once finished and renders rows with present/missing badges", async () => {
    vi.spyOn(scenariosApi, "getScenarioArtifacts").mockResolvedValue(SAMPLE);
    const wrapper = mount(ScenarioArtifactsPanel, {
      props: {
        taskId: "abc",
        scenarioId: "code_review",
        taskStatus: "completed",
      },
      global: { plugins: [createPinia()] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Expected artifacts");
    expect(wrapper.text()).toContain("1 of 2 present");
    const items = wrapper.findAll(".scenario-artifacts__item");
    expect(items).toHaveLength(2);
    expect(items[0].classes()).toContain("scenario-artifacts__item--present");
    expect(items[1].classes()).toContain("scenario-artifacts__item--missing");
    expect(items[0].find("a").attributes("href")).toContain(
      "/artifacts/abc/pipeline.json",
    );
  });

  it("surfaces error message when api fails", async () => {
    vi.spyOn(scenariosApi, "getScenarioArtifacts").mockRejectedValue(
      new Error("HTTP 500"),
    );
    const wrapper = mount(ScenarioArtifactsPanel, {
      props: {
        taskId: "abc",
        scenarioId: "code_review",
        taskStatus: "completed",
      },
      global: { plugins: [createPinia()] },
    });
    await flushPromises();
    expect(wrapper.find(".scenario-artifacts__error").text()).toContain("HTTP 500");
  });
});
