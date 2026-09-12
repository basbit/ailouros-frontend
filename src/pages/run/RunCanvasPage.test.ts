import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import RunCanvasPage from "./RunCanvasPage.vue";

describe("RunCanvasPage", () => {
  it("renders page layout with header and canvas container", () => {
    const wrapper = mount(RunCanvasPage, {
      global: {
        stubs: {
          AppHeaderContainer: {
            template: "<header class='mock-header'>Header</header>",
          },
          PipelineCanvasView: { template: "<div class='mock-canvas'>Canvas</div>" },
        },
      },
    });

    expect(wrapper.find(".run-page-layout").exists()).toBe(true);
    expect(wrapper.find(".mock-header").exists()).toBe(true);
    expect(wrapper.find(".mock-canvas").exists()).toBe(true);
  });
});
