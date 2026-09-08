import { beforeEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import CrossValidation from "./CrossValidation.vue";
import type { CrossValidatorSnap, CrossValidatorUiState } from "./useCrossValidation";

function validator(overrides: Partial<CrossValidatorSnap> = {}): CrossValidatorSnap {
  return {
    source: "role",
    role: "",
    environment: "ollama",
    model: "",
    remote_profile: "",
    prompt: "",
    apply_edits: false,
    ...overrides,
  };
}

function uiState(
  overrides: Partial<CrossValidatorUiState> = {},
): CrossValidatorUiState {
  return { modelChoices: [], modelFetchError: null, ...overrides };
}

function mountPanel(
  validators: CrossValidatorSnap[],
  uiStates: CrossValidatorUiState[] = validators.map(() => uiState()),
) {
  return mount(CrossValidation, {
    props: {
      validators,
      uiStates,
      roles: ["pm", "ba", "architect", "dev"],
      profileOptions: [{ value: "anthropic", label: "anthropic" }],
    },
  });
}

describe("CrossValidation panel", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("ailouros.locale", "en");
    setActivePinia(createPinia());
  });

  it("a role-backed row offers roles and no model picker", () => {
    const wrapper = mountPanel([validator({ source: "role", role: "pm" })]);

    expect(wrapper.find(".xval-role").exists()).toBe(true);
    expect(wrapper.find(".xval-env").exists()).toBe(false);
    expect(wrapper.find(".xval-model").exists()).toBe(false);
  });

  it("a model-backed row offers env + model, and a profile only on cloud", async () => {
    const wrapper = mountPanel([validator({ source: "model", environment: "ollama" })]);

    expect(wrapper.find(".xval-env").exists()).toBe(true);
    expect(wrapper.find(".xval-profile").exists()).toBe(false);

    await wrapper.setProps({
      validators: [validator({ source: "model", environment: "cloud" })],
    });

    expect(wrapper.find(".xval-profile").exists()).toBe(true);
  });

  it("shows the fetch failure instead of an empty model dropdown", () => {
    const wrapper = mountPanel(
      [validator({ source: "model", environment: "ollama" })],
      [uiState({ modelFetchError: "ollama is down" })],
    );

    expect(wrapper.find(".model-fetch-error").text()).toContain("ollama is down");
    expect(wrapper.find("select.xval-model").exists()).toBe(false);
  });

  it("picking Custom… clears the model rather than storing the sentinel", async () => {
    const wrapper = mountPanel(
      [validator({ source: "model", environment: "ollama", model: "qwen3:8b" })],
      [uiState({ modelChoices: [["qwen3:8b", "qwen3:8b"]] })],
    );

    await wrapper.find("select.xval-model").setValue("__custom__");

    expect(wrapper.emitted("update")?.at(-1)).toEqual([0, "model", ""]);
  });

  it("a model outside the catalogue falls back to the custom field", () => {
    const wrapper = mountPanel(
      [validator({ source: "model", environment: "ollama", model: "unlisted:7b" })],
      [uiState({ modelChoices: [["qwen3:8b", "qwen3:8b"]] })],
    );

    expect((wrapper.find("select.xval-model").element as HTMLSelectElement).value).toBe(
      "__custom__",
    );
    expect((wrapper.find(".xval-model-custom").element as HTMLInputElement).value).toBe(
      "unlisted:7b",
    );
  });

  it("warns when more than one validator would edit the same files", () => {
    const wrapper = mountPanel([
      validator({ source: "role", role: "dev", apply_edits: true }),
      validator({ source: "role", role: "qa", apply_edits: true }),
    ]);

    expect(wrapper.find(".xval__warn").text()).toContain("More than one editor");
  });

  it("warns when the chain would change no files at all", () => {
    const wrapper = mountPanel([validator({ source: "role", role: "pm" })]);

    expect(wrapper.find(".xval__warn").text()).toContain("No editor selected");
  });

  it("stays silent when exactly one validator edits", () => {
    const wrapper = mountPanel([
      validator({ source: "role", role: "pm" }),
      validator({ source: "role", role: "dev", apply_edits: true }),
    ]);

    expect(wrapper.find(".xval__warn").exists()).toBe(false);
  });

  it("move buttons are disabled at the ends of the chain", () => {
    const wrapper = mountPanel([
      validator({ source: "role", role: "pm" }),
      validator({ source: "role", role: "dev" }),
    ]);
    const rows = wrapper.findAll(".xval-row");

    const firstUp = rows[0].findAll("button")[0];
    const lastDown = rows[1].findAll("button")[1];

    expect(firstUp.attributes("disabled")).toBeDefined();
    expect(lastDown.attributes("disabled")).toBeDefined();
  });

  it("emits add/remove/move for the chain owner to apply", async () => {
    const wrapper = mountPanel([
      validator({ source: "role", role: "pm" }),
      validator({ source: "role", role: "dev" }),
    ]);

    await wrapper.find(".xval__add").trigger("click");
    const secondRowButtons = wrapper.findAll(".xval-row")[1].findAll("button");
    await secondRowButtons[0].trigger("click");
    await secondRowButtons[2].trigger("click");

    expect(wrapper.emitted("add")).toHaveLength(1);
    expect(wrapper.emitted("move")?.[0]).toEqual([1, -1]);
    expect(wrapper.emitted("remove")?.[0]).toEqual([1]);
  });
});
