import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

vi.mock("@/shared/api/endpoints/user-settings", () => ({
  getUserSettings: vi.fn().mockResolvedValue({}),
  putUserSettings: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/shared/api/endpoints/remote-control", () => ({
  getTelegramIngressStatus: vi.fn(),
  rotateActionLinkSecret: vi.fn(),
}));
vi.mock("@/shared/api/endpoints/scenarios", () => ({
  listScenarios: vi.fn().mockResolvedValue({
    scenarios: [
      { id: "build_feature", title: "Build feature" },
      { id: "fix_bug", title: "Fix bug" },
    ],
  }),
}));

import { ApiError } from "@/shared/api/http";
import { putUserSettings } from "@/shared/api/endpoints/user-settings";
import {
  getTelegramIngressStatus,
  rotateActionLinkSecret,
} from "@/shared/api/endpoints/remote-control";
import { flushGlobalSettingsSync, useGlobalSearchKeys } from "@/shared/lib/global-search-keys";
import RemoteControlSettings from "./RemoteControlSettings.vue";

function lastPayload(): Record<string, unknown> {
  return vi.mocked(putUserSettings).mock.calls.at(-1)?.[0] as Record<string, unknown>;
}

async function mountSettings() {
  const wrapper = mount(RemoteControlSettings, {
    global: { stubs: { FilePathPicker: true, RouterLink: true } },
  });
  await flushPromises();
  return wrapper;
}

describe("RemoteControlSettings", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.mocked(getTelegramIngressStatus).mockResolvedValue({
      state: "error",
      reason: "the bot token is not set",
    });
    const { state } = useGlobalSearchKeys();
    state.swarm_telegram_ingress_enabled = false;
    state.swarm_action_link_secret = "";
    state.swarm_action_link_secret_prev = "";
    state.swarm_telegram_ingress_run_scenario = "";
  });

  it("shows the bot's live state with the reason it is not running", async () => {
    const wrapper = await mountSettings();
    const badge = wrapper.get('[data-test="telegram-status"]');
    expect(badge.text()).toContain("Error");
    expect(badge.text()).toContain("the bot token is not set");
  });

  it("saves the Telegram toggle through the settings API", async () => {
    const wrapper = await mountSettings();
    await wrapper.get('[data-test="toggle-swarm_telegram_ingress_enabled"]').setValue(true);
    await flushGlobalSettingsSync();
    expect(lastPayload().swarm_telegram_ingress_enabled).toBe(true);
  });

  it("offers every catalog scenario for /run", async () => {
    const wrapper = await mountSettings();
    const options = wrapper.get('[data-test="run-scenario"]').findAll("option");
    expect(options.map((option) => option.attributes("value"))).toEqual(["", "build_feature", "fix_bug"]);
    await wrapper.get('[data-test="run-scenario"]').setValue("fix_bug");
    await flushGlobalSettingsSync();
    expect(lastPayload().swarm_telegram_ingress_run_scenario).toBe("fix_bug");
  });

  it("generates a 32-byte signing secret in the browser and saves it", async () => {
    const wrapper = await mountSettings();
    await wrapper.get('[data-test="generate-swarm_action_link_secret"]').trigger("click");
    await flushGlobalSettingsSync();
    expect(lastPayload().swarm_action_link_secret).toMatch(/^[0-9a-f]{64}$/);
    expect(wrapper.find('[data-test="generated-swarm_action_link_secret"]').exists()).toBe(false);
    expect(useGlobalSearchKeys().state.swarm_action_link_secret).toBe("***");
  });

  it("rotates on the server with a fresh secret after the pending save lands", async () => {
    vi.mocked(rotateActionLinkSecret).mockResolvedValue({ status: "ok", updated: [] });
    const wrapper = await mountSettings();
    const rotate = wrapper.get('[data-test="rotate-action-link-secret"]');
    expect(rotate.attributes("disabled")).toBeDefined();

    await wrapper.get('[data-test="secret-swarm_action_link_secret"]').setValue("c".repeat(40));
    await rotate.trigger("click");
    await flushPromises();

    const puts = vi.mocked(putUserSettings).mock;
    const savedIndex = puts.calls.findIndex(
      ([payload]) => payload.swarm_action_link_secret === "c".repeat(40),
    );
    expect(savedIndex).toBeGreaterThanOrEqual(0);
    const rotated = vi.mocked(rotateActionLinkSecret).mock.invocationCallOrder[0];
    expect(puts.invocationCallOrder[savedIndex]).toBeLessThan(rotated);
    expect(vi.mocked(rotateActionLinkSecret).mock.calls[0][0]).toMatch(/^[0-9a-f]{64}$/);
    expect(useGlobalSearchKeys().state.swarm_action_link_secret).toBe("***");
    expect(useGlobalSearchKeys().state.swarm_action_link_secret_prev).toBe("***");
    expect(wrapper.find('[data-test="rotate-done"]').exists()).toBe(true);
  });

  it("shows why a rotation was refused", async () => {
    vi.mocked(rotateActionLinkSecret).mockRejectedValue(
      new ApiError("HTTP 400", 400, JSON.stringify({ detail: "there is no current action link secret" })),
    );
    const { state } = useGlobalSearchKeys();
    state.swarm_action_link_secret = "***";
    const wrapper = await mountSettings();
    await wrapper.get('[data-test="rotate-action-link-secret"]').trigger("click");
    await flushPromises();
    expect(wrapper.get('[data-test="rotate-error"]').text()).toContain("there is no current action link secret");
  });

  it("shows a refused save next to the fields", async () => {
    vi.mocked(putUserSettings).mockRejectedValueOnce(
      new ApiError("HTTP 400", 400, JSON.stringify({ detail: "swarm_telegram_ingress_allowed_chat_ids: invalid" })),
    );
    const wrapper = await mountSettings();
    await wrapper.get('[data-test="text-swarm_telegram_ingress_allowed_chat_ids"]').setValue("abc");
    await flushGlobalSettingsSync();
    await flushPromises();
    expect(wrapper.get('[data-test="settings-sync-error"]').text()).toContain("allowed_chat_ids: invalid");
  });
});
