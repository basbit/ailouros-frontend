import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

vi.mock("@/shared/api/endpoints/user-settings", () => ({
  getUserSettings: vi.fn(),
  putUserSettings: vi.fn().mockResolvedValue(undefined),
}));

import { getUserSettings, putUserSettings } from "@/shared/api/endpoints/user-settings";
import { flushGlobalSettingsSync, useGlobalSearchKeys } from "@/shared/lib/global-search-keys";
import { restartStatus } from "@/shared/lib/global-search/restart-status";
import RestartPendingBanner from "@/shared/components/settings-fields/RestartPendingBanner.vue";
import AgenticSettings from "./AgenticSettings.vue";

const RouterLinkStub = {
  props: ["to"],
  template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
};

async function mountWith(component: object, response: Record<string, unknown>) {
  vi.mocked(getUserSettings).mockResolvedValue(response);
  const wrapper = mount(component, { global: { stubs: { RouterLink: RouterLinkStub } } });
  await useGlobalSearchKeys().loadFromBackend();
  await flushPromises();
  return wrapper;
}

describe("Autonomous work pane", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    const { state } = useGlobalSearchKeys();
    state.swarm_goal_scheduler_enabled = false;
    state.swarm_allow_workspace_write = false;
    state.swarm_allow_command_exec = false;
    restartStatus.pending = [];
    restartStatus.requiredFields = [];
  });

  it("marks a value that comes only from .env and links a missing prerequisite to its field", async () => {
    const wrapper = await mountWith(AgenticSettings, {
      swarm_goal_scheduler_enabled: true,
      swarm_allow_workspace_write: false,
      field_sources: { swarm_goal_scheduler_enabled: "env" },
    });

    expect(wrapper.find('[data-test="source-env-swarm_goal_scheduler_enabled"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="source-env-swarm_allow_command_exec"]').exists()).toBe(false);
    const prerequisite = wrapper.get('[data-test="prerequisite-swarm_allow_workspace_write"]');
    expect(JSON.parse(prerequisite.get("a").attributes("data-to") as string)).toEqual({
      path: "/settings/agentic",
      query: { focus: "swarm_allow_workspace_write" },
    });
  });

  it("saves only the toggle that was changed", async () => {
    const wrapper = await mountWith(AgenticSettings, { field_sources: {} });

    await wrapper.get('[data-test="toggle-swarm_allow_command_exec"]').setValue(true);
    await flushGlobalSettingsSync();

    expect(vi.mocked(putUserSettings).mock.calls.at(-1)?.[0]).toEqual({
      swarm_allow_command_exec: true,
    });
  });

  it("shows the restart badge and the pending-restart banner the server reports", async () => {
    const wrapper = await mountWith(AgenticSettings, {
      restart_required_fields: ["swarm_goal_scheduler_timezone"],
      restart_pending: ["SWARM_CORS_ALLOWED_ORIGINS"],
    });
    const banner = mount(RestartPendingBanner);

    expect(wrapper.find('[data-test="restart-required-swarm_goal_scheduler_timezone"]').exists()).toBe(true);
    expect(banner.get('[data-test="restart-pending-banner"]').text()).toContain(
      "SWARM_CORS_ALLOWED_ORIGINS",
    );
  });
});
