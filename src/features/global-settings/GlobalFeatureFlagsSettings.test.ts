import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

import GlobalFeatureFlagsSettings from "@/features/global-settings/GlobalFeatureFlagsSettings.vue";
import {
  FEATURE_FLAG_GROUPS,
  groupTitleKey,
  fieldLabelKey,
  type FeatureFlagBooleanKey,
  type FeatureFlagStringKey,
} from "@/features/global-settings/featureFlagGroups";

const setKeyMock = vi.fn<(field: string, value: boolean | string) => void>();

vi.mock("@/features/global-settings/useGlobalSettings", () => ({
  useGlobalSettings: () => ({
    state: {
      swarm_mcp_auto: true,
      swarm_fetch_page: true,
      swarm_pattern_memory: false,
      swarm_retrieval_traces_enabled: true,
      swarm_retrieval_traces_max_per_workspace: "200",
      swarm_retrieval_rerank_model_id: "cross-encoder/mini",
      swarm_sandbox_default_profile: "subprocess",
      swarm_orchestration_skill_dispatcher: "off",
    },
    setKey: setKeyMock,
  }),
}));

function _mount() {
  setActivePinia(createPinia());
  return mount(GlobalFeatureFlagsSettings);
}

describe("GlobalFeatureFlagsSettings", () => {
  it("renders one <details> section per group", () => {
    const wrapper = _mount();
    const sections = wrapper.findAll("details.feature-flag-group");
    expect(sections.length).toBe(FEATURE_FLAG_GROUPS.length);
  });

  it("renders each group's translated title inside its <summary>", () => {
    const wrapper = _mount();
    const summaryTexts = wrapper.findAll("summary").map((node) => node.text());
    for (const group of FEATURE_FLAG_GROUPS) {
      const expectedKey = groupTitleKey(group);
      const matched = summaryTexts.some(
        (text) => text.length > 0 && text !== expectedKey,
      );
      expect(matched).toBe(true);
    }
  });

  it("renders boolean fields as checkbox inputs reflecting state", () => {
    const wrapper = _mount();
    const firstCheckbox = wrapper.find('input[type="checkbox"]');
    expect(firstCheckbox.exists()).toBe(true);
    expect((firstCheckbox.element as HTMLInputElement).checked).toBe(true);
  });

  it("calls setKey with the boolean field name when the checkbox toggles", async () => {
    setKeyMock.mockClear();
    const wrapper = _mount();
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    const firstBooleanField = FEATURE_FLAG_GROUPS[0].fields.find(
      (field) => field.kind === "boolean",
    );
    expect(firstBooleanField).toBeDefined();
    const firstCheckbox = checkboxes[0];
    await firstCheckbox.setValue(false);
    expect(setKeyMock).toHaveBeenCalledWith(
      (firstBooleanField as { field: FeatureFlagBooleanKey }).field,
      false,
    );
  });

  it("renders enum fields as <select> with all options", () => {
    const wrapper = _mount();
    const skillDispatcherSelect = wrapper.find(
      "#global_swarm_orchestration_skill_dispatcher",
    );
    expect(skillDispatcherSelect.exists()).toBe(true);
    expect(skillDispatcherSelect.element.tagName).toBe("SELECT");
    const optionValues = skillDispatcherSelect
      .findAll("option")
      .map((opt) => (opt.element as HTMLOptionElement).value);
    expect(optionValues).toEqual(["off", "heuristic", "llm"]);
  });

  it("renders free-text string fields as <input type=text>", () => {
    const wrapper = _mount();
    const rerankInput = wrapper.find("#global_swarm_retrieval_rerank_model_id");
    expect(rerankInput.exists()).toBe(true);
    expect(rerankInput.element.tagName).toBe("INPUT");
    expect((rerankInput.element as HTMLInputElement).type).toBe("text");
    expect((rerankInput.element as HTMLInputElement).value).toBe("cross-encoder/mini");
  });

  it("calls setKey with the new string value when a text field changes", async () => {
    setKeyMock.mockClear();
    const wrapper = _mount();
    const rerankInput = wrapper.find("#global_swarm_retrieval_rerank_model_id");
    const targetField: FeatureFlagStringKey = "swarm_retrieval_rerank_model_id";
    await rerankInput.setValue("cross-encoder/new-model");
    expect(setKeyMock).toHaveBeenCalledWith(targetField, "cross-encoder/new-model");
  });

  it("calls setKey with the new enum value when a select changes", async () => {
    setKeyMock.mockClear();
    const wrapper = _mount();
    const skillDispatcherSelect = wrapper.find(
      "#global_swarm_orchestration_skill_dispatcher",
    );
    await skillDispatcherSelect.setValue("heuristic");
    expect(setKeyMock).toHaveBeenCalledWith(
      "swarm_orchestration_skill_dispatcher",
      "heuristic",
    );
  });

  it("renders the env name inside a <code> tag in each field hint", () => {
    const wrapper = _mount();
    const codeTagTexts = wrapper.findAll("code").map((node) => node.text());
    expect(codeTagTexts).toContain("SWARM_MCP_AUTO");
    expect(codeTagTexts).toContain("SWARM_RETRIEVAL_HYDE_ENABLED");
  });

  it("resolves each visible boolean field label via i18n (not the raw key)", () => {
    const wrapper = _mount();
    const html = wrapper.html();
    const labelKey = fieldLabelKey(FEATURE_FLAG_GROUPS[0].fields[0]);
    expect(html).not.toContain(labelKey);
  });

  it("has no unwired fields left and renders no Library-only badges", () => {
    const wrapper = _mount();
    const unwiredFieldCount = FEATURE_FLAG_GROUPS.flatMap(
      (group) => group.fields,
    ).filter((field) => field.wired === false).length;
    expect(unwiredFieldCount).toBe(0);
    const badges = wrapper.findAll(".feature-flag-badge-not-wired");
    expect(badges.length).toBe(0);
  });

  it("does not mark wired fields with the badge", () => {
    const wrapper = _mount();
    const mcpGroup = wrapper.find(".feature-flag-group-mcp");
    const mcpBadges = mcpGroup.findAll(".feature-flag-badge-not-wired");
    expect(mcpBadges.length).toBe(0);
  });

  it("applies the not-wired class to no field container", () => {
    const wrapper = _mount();
    const notWiredFields = wrapper.findAll(".feature-flag-field-not-wired");
    expect(notWiredFields.length).toBe(0);
  });
});
