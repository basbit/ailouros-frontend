import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";

const secretsApi = vi.hoisted(() => ({
  names: { value: ["TAVILY_API_KEY"] as string[] },
  loading: { value: false },
  error: { value: null as string | null },
  refresh: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/features/secrets/useSecrets", () => ({
  useSecrets: () => secretsApi,
}));

import SecretsPane from "./SecretsPane.vue";

describe("SecretsPane", () => {
  it("refreshes on mount and lists existing secret names", () => {
    const wrapper = mount(SecretsPane);
    expect(secretsApi.refresh).toHaveBeenCalled();
    expect(wrapper.text()).toContain("TAVILY_API_KEY");
  });

  it("saves a new secret from the add form", async () => {
    const wrapper = mount(SecretsPane);
    const inputs = wrapper.findAll("input.secrets-pane__input");
    await inputs[0].setValue("NEW_KEY");
    await inputs[1].setValue("the-value");
    await wrapper.find("form.secrets-pane__form").trigger("submit");
    expect(secretsApi.save).toHaveBeenCalledWith("NEW_KEY", "the-value");
  });

  it("removes a secret on delete click", async () => {
    const wrapper = mount(SecretsPane);
    await wrapper.find(".secrets-pane__delete").trigger("click");
    expect(secretsApi.remove).toHaveBeenCalledWith("TAVILY_API_KEY");
  });
});
