import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import RunGridPage from "./RunGridPage.vue";

describe("RunGridPage", () => {
  it("renders page layout with header and grid container", () => {
    const wrapper = mount(RunGridPage, {
      global: {
        stubs: {
          AppHeaderContainer: {
            template: "<header class='mock-header'>Header</header>",
          },
          PipelineGridView: { template: "<div class='mock-grid'>Grid</div>" },
        },
      },
    });

    expect(wrapper.find(".run-page-layout").exists()).toBe(true);
    expect(wrapper.find(".mock-header").exists()).toBe(true);
    expect(wrapper.find(".mock-grid").exists()).toBe(true);
  });
});
