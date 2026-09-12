import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import StepForkButton from "../StepForkButton.vue";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

describe("StepForkButton", () => {
  it("asks the page to fork when clicked", async () => {
    const wrapper = mount(StepForkButton);

    await wrapper.find(".step-fork-btn").trigger("click");

    expect(wrapper.emitted("fork")).toBeTruthy();
  });

  it("is disabled and relabelled while a fork is in flight", () => {
    const wrapper = mount(StepForkButton, { props: { busy: true } });

    const button = wrapper.find<HTMLButtonElement>(".step-fork-btn");
    expect(button.attributes("disabled")).toBeDefined();
    expect(button.text()).toContain("stepFork.forking");
  });
});
