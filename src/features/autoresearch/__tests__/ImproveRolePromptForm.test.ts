import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ImproveRolePromptForm from "../ImproveRolePromptForm.vue";
import type { PromptPresetFormState } from "../model/promptPreset";

const PRESET = { workspace_root: "/repo/app", roles: ["dev", "pm", "qa"], problem: null };

function mountForm(preset: typeof PRESET | null = PRESET, loadError = "") {
  return mount(ImproveRolePromptForm, {
    props: { preset, loadError, busy: false, error: "" },
  });
}

describe("ImproveRolePromptForm", () => {
  it("preselects the first role and emits the filled form", async () => {
    const wrapper = mountForm();
    await wrapper.get('[name="promptJudgeModel"]').setValue("judge-1");

    await wrapper.get("form").trigger("submit");

    const [[state]] = wrapper.emitted("submit") as [[PromptPresetFormState]];
    expect(state).toMatchObject({ role: "dev", samples: 2, judgeModel: "judge-1" });
    expect(state.goal).toContain("golden-case score");
  });

  it("does not submit when the goal is empty", async () => {
    const wrapper = mountForm();
    await wrapper.get('[name="promptGoal"]').setValue(" ");

    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("submit")).toBeUndefined();
    expect(wrapper.get('[data-testid="prompt-form-problems"]').text()).toContain(
      "Describe the goal.",
    );
  });

  it("stays disabled while the preset has not loaded", async () => {
    const wrapper = mountForm(null, "Could not load the prompt preset: HTTP 500");

    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("submit")).toBeUndefined();
    expect(wrapper.get('[data-testid="prompt-load-error"]').text()).toContain("HTTP 500");
    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
  });
});
