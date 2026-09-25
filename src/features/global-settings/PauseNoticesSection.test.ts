import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

vi.mock("@/shared/api/endpoints/user-settings", () => ({
  getUserSettings: vi.fn(),
  putUserSettings: vi.fn().mockResolvedValue(undefined),
}));

import { getUserSettings } from "@/shared/api/endpoints/user-settings";
import { useGlobalSearchKeys } from "@/shared/lib/global-search-keys";
import PauseNoticesSection from "./PauseNoticesSection.vue";

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

describe("Pause notices", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("says notifications are off and links to the switch", async () => {
    const wrapper = await mountWith(PauseNoticesSection, { swarm_notify_enabled: false });

    expect(wrapper.find('[data-test="prerequisite-swarm_notify_enabled"]').exists()).toBe(true);
  });

  it("is ready once a channel and signed links are set up", async () => {
    const wrapper = await mountWith(PauseNoticesSection, {
      swarm_notify_enabled: true,
      swarm_notify_webhook_url: "https://hooks.example.com/x",
      swarm_human_gate_enabled: true,
      swarm_action_link_secret: "***",
      swarm_telegram_ingress_public_base_url: "https://swarm.example.com",
    });

    expect(wrapper.find('[data-test^="prerequisite-"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("signed Approve / Continue / Cancel buttons");
  });
});
