import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import AutoresearchForm from "../AutoresearchForm.vue";
import type { AutoresearchFormState } from "../model/form";

function mountForm() {
  return mount(AutoresearchForm, {
    props: { workspaceRoot: "/work/project", busy: false, error: "" },
  });
}

describe("AutoresearchForm", () => {
  it("tells the user that uncommitted changes are excluded", () => {
    expect(mountForm().get('[data-testid="uncommitted-note"]').text()).toContain(
      "Uncommitted changes",
    );
  });

  it("shows validation problems instead of submitting an incomplete form", async () => {
    const wrapper = mountForm();

    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("submit")).toBeUndefined();
    expect(wrapper.get('[data-testid="form-problems"]').text()).toContain(
      "Describe the goal.",
    );
  });

  it("emits the filled form", async () => {
    const wrapper = mountForm();
    await wrapper.get('[name="goal"]').setValue("faster parser");
    await wrapper.get('[name="metricCommand"]').setValue("npm run bench");
    await wrapper.get('[name="mutablePaths"]').setValue("src/**");
    await wrapper.get('[name="direction"]').setValue("max");

    await wrapper.get("form").trigger("submit");

    const [[state]] = wrapper.emitted("submit") as [[AutoresearchFormState]];
    expect(state).toMatchObject({
      workspaceRoot: "/work/project",
      goal: "faster parser",
      metricCommand: "npm run bench",
      mutablePaths: "src/**",
      direction: "max",
    });
  });

  it("asks for the pattern only for regex and json rules", async () => {
    const wrapper = mountForm();
    expect(wrapper.find('[name="metricParseArgument"]').exists()).toBe(false);

    await wrapper.get('[name="metricParseKind"]').setValue("json");

    expect(wrapper.find('[name="metricParseArgument"]').exists()).toBe(true);
  });
});
