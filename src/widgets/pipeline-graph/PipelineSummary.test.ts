import { beforeEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PipelineSummary from "@/widgets/pipeline-graph/PipelineSummary.vue";

describe("PipelineSummary", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("ailouros.locale", "en");
    setActivePinia(createPinia());
  });

  it("renders count, non-zero chips, and full tooltip breakdown", () => {
    const wrapper = mount(PipelineSummary, {
      props: {
        steps: ["pm", "review_pm", "human_pm", "ba", "dev_retry_gate"],
      },
      global: {
        plugins: [createPinia()],
      },
    });

    expect(wrapper.text()).toContain("5 steps");
    expect(wrapper.text()).toContain("2 agents");
    expect(wrapper.text()).toContain("1 reviewers");
    expect(wrapper.text()).toContain("1 human gates");
    expect(wrapper.text()).toContain("1 verification");
    expect(wrapper.attributes("title")).toBe(
      "Pipeline breakdown: 2 agents, 1 reviewers, 1 human gates, 1 verification",
    );
  });

  it("keeps the empty contract explicit", () => {
    const wrapper = mount(PipelineSummary, {
      props: {
        steps: [],
      },
      global: {
        plugins: [createPinia()],
      },
    });

    expect(wrapper.text()).toContain("0 steps");
    expect(wrapper.findAll(".pipeline-summary__chip")).toHaveLength(0);
    expect(wrapper.attributes("title")).toBe("Pipeline is empty");
  });
});
