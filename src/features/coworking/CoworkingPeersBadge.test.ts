import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import CoworkingPeersBadge from "./CoworkingPeersBadge.vue";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe("CoworkingPeersBadge", () => {
  it("renders local user initials and remote peers", () => {
    const wrapper = mount(CoworkingPeersBadge, {
      props: {
        localUser: {
          id: "u_local",
          name: "Developer Alex",
          color: "#3b82f6",
        },
        peers: [
          {
            id: "p_1",
            name: "Sarah QA",
            color: "#10b981",
            x: 0,
            y: 0,
          },
        ],
      },
    });

    // Check initials
    expect(wrapper.text()).toContain("DA");
    expect(wrapper.text()).toContain("SQ");
  });

  it("opens profile editor popover and emits updateProfile", async () => {
    const wrapper = mount(CoworkingPeersBadge, {
      props: {
        localUser: {
          id: "u_local",
          name: "Developer Alex",
          color: "#3b82f6",
        },
        peers: [],
      },
    });

    expect(wrapper.find(".coworking-popover").exists()).toBe(false);

    // Click on local avatar
    await wrapper.find(".coworking-peers__avatar--me").trigger("click");
    expect(wrapper.find(".coworking-popover").exists()).toBe(true);

    // Edit name
    const input = wrapper.find(".coworking-popover__input");
    await input.setValue("Senior Dev Alex");

    // Click save
    await wrapper.find(".coworking-popover__btn--save").trigger("click");

    expect(wrapper.emitted("updateProfile")).toBeTruthy();
    expect(wrapper.emitted("updateProfile")?.[0]).toEqual([
      { name: "Senior Dev Alex", color: "#3b82f6" },
    ]);
    expect(wrapper.find(".coworking-popover").exists()).toBe(false);
  });
});
