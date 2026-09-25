import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

vi.mock("@/shared/api/endpoints/user-settings", () => ({
  getUserSettings: vi.fn().mockResolvedValue({}),
  putUserSettings: vi.fn().mockResolvedValue(undefined),
}));

import { putUserSettings } from "@/shared/api/endpoints/user-settings";
import { flushGlobalSettingsSync, useGlobalSearchKeys } from "@/shared/lib/global-search-keys";
import IssueAutopilotWebhookSecrets from "./IssueAutopilotWebhookSecrets.vue";

describe("IssueAutopilotWebhookSecrets", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    const { state } = useGlobalSearchKeys();
    state.swarm_github_webhook_secret = "";
    state.swarm_linear_webhook_secret = "***";
  });

  it("shows a generated webhook secret once for copying, saves it, and reports the save", async () => {
    const wrapper = mount(IssueAutopilotWebhookSecrets);
    await wrapper.get('[data-test="generate-swarm_github_webhook_secret"]').trigger("click");
    const shown = wrapper.get('[data-test="generated-swarm_github_webhook_secret"] code').text();
    expect(shown).toMatch(/^[0-9a-f]{64}$/);

    await flushGlobalSettingsSync();
    await flushPromises();
    const payload = vi.mocked(putUserSettings).mock.calls.at(-1)?.[0];
    expect(payload?.swarm_github_webhook_secret).toBe(shown);
    expect(payload).not.toHaveProperty("swarm_linear_webhook_secret");
    expect(wrapper.emitted("saved")).toHaveLength(1);
    expect(wrapper.get('[data-test="generated-swarm_github_webhook_secret"] code').text()).toBe(shown);
  });

  it("marks a secret the server already holds as saved instead of showing it", () => {
    const wrapper = mount(IssueAutopilotWebhookSecrets);
    const input = wrapper.get('[data-test="secret-swarm_linear_webhook_secret"]');
    expect((input.element as HTMLInputElement).value).toBe("");
    expect(input.attributes("placeholder")).toContain("saved");
  });

  it("saves the delivery limits as typed", async () => {
    const wrapper = mount(IssueAutopilotWebhookSecrets);
    await wrapper.get('[data-test="text-swarm_linear_webhook_tolerance_seconds"]').setValue("120");
    await flushGlobalSettingsSync();
    expect(vi.mocked(putUserSettings).mock.calls.at(-1)?.[0].swarm_linear_webhook_tolerance_seconds).toBe("120");
  });
});
