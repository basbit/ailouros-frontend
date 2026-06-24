import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ModelPickerField from "./ModelPickerField.vue";

const baseProps = {
  environment: "ollama",
  modelChoices: [
    ["__custom__", "Custom…"],
    ["qwen2.5:7b", "qwen2.5:7b"],
  ] as [string, string][],
  modelSel: "qwen2.5:7b",
  modelCustom: "",
};

describe("ModelPickerField", () => {
  it("renders env options and the model choices", () => {
    const wrapper = mount(ModelPickerField, { props: baseProps });
    const selects = wrapper.findAll("select");
    const envOptions = selects[0].findAll("option").map((o) => o.element.value);
    expect(envOptions).toContain("ollama");
    expect(envOptions).toContain("lmstudio");
    expect(envOptions).toContain("cloud");
    const modelOptions = selects[selects.length - 1]
      .findAll("option")
      .map((o) => o.element.value);
    expect(modelOptions).toContain("qwen2.5:7b");
    expect(modelOptions).toContain("__custom__");
  });

  it("emits update:environment when the env select changes", async () => {
    const wrapper = mount(ModelPickerField, { props: baseProps });
    await wrapper.findAll("select")[0].setValue("cloud");
    expect(wrapper.emitted("update:environment")?.[0]).toEqual(["cloud"]);
  });

  it("emits update:modelSel when the model select changes", async () => {
    const wrapper = mount(ModelPickerField, { props: baseProps });
    const selects = wrapper.findAll("select");
    await selects[selects.length - 1].setValue("__custom__");
    expect(wrapper.emitted("update:modelSel")?.[0]).toEqual(["__custom__"]);
  });

  it("shows the custom input only when modelSel is __custom__ and emits on input", async () => {
    const wrapper = mount(ModelPickerField, {
      props: { ...baseProps, modelSel: "qwen2.5:7b" },
    });
    expect(wrapper.find("input.cfg-custom").exists()).toBe(false);
    await wrapper.setProps({ modelSel: "__custom__", modelCustom: "" });
    const input = wrapper.find("input.cfg-custom");
    expect(input.exists()).toBe(true);
    await input.setValue("google/gemma-2-9b");
    expect(wrapper.emitted("update:modelCustom")?.[0]).toEqual(["google/gemma-2-9b"]);
  });

  it("shows a remote-profile select when profileOptions are provided", () => {
    const wrapper = mount(ModelPickerField, {
      props: {
        ...baseProps,
        environment: "cloud",
        profileOptions: [{ value: "p1", label: "OpenRouter" }],
        remoteProfile: "p1",
      },
    });
    expect(wrapper.find("select.cfg-remote-profile").exists()).toBe(true);
  });

  it("hides the profile select and model select, showing an error, when modelFetchError is set", () => {
    const wrapper = mount(ModelPickerField, {
      props: { ...baseProps, modelFetchError: "Connection refused" },
    });
    expect(wrapper.find(".model-fetch-error").text()).toContain("Connection refused");
  });

  it("renders the leading slot (e.g. role name) and the env-code hint", () => {
    const wrapper = mount(ModelPickerField, {
      props: { ...baseProps, envCode: "SWARM_SELF_VERIFY_MODEL" },
      slots: { leading: "<span class='role-name'>pm</span>" },
    });
    expect(wrapper.find(".role-name").text()).toBe("pm");
    expect(wrapper.find(".hint").text()).toContain("SWARM_SELF_VERIFY_MODEL");
  });
});
