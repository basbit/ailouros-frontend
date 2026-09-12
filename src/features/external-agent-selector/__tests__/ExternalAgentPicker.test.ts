import { describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import ExternalAgentPicker from "../ExternalAgentPicker.vue";
import * as agentApi from "@/entities/external-agent/api/external-agent-api";

vi.mock("@/entities/external-agent/api/external-agent-api", () => ({
  fetchExternalHarnesses: vi.fn(),
}));

describe("ExternalAgentPicker", () => {
  it("renders harnesses and selects available item", async () => {
    vi.mocked(agentApi.fetchExternalHarnesses).mockResolvedValue([
      {
        name: "Native LLM",
        generator_type: "native",
        is_available: true,
        binary_path: null,
        description: "Built-in pipeline",
      },
      {
        name: "Claude Code",
        generator_type: "claude_code",
        is_available: false,
        binary_path: null,
        description: "Standalone CLI",
      },
    ]);

    const wrapper = mount(ExternalAgentPicker, {
      props: {
        modelValue: "native",
      },
    });
    await flushPromises();

    const items = wrapper.findAll(".agent-picker__item");
    expect(items.length).toBe(2);

    expect(items[0].classes()).toContain("agent-picker__item--selected");
    expect(items[1].classes()).toContain("agent-picker__item--disabled");

    await items[1].trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeFalsy();

    await items[0].trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["native"]);
  });
});
