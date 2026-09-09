import { describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import SandboxModeSwitch from "../SandboxModeSwitch.vue";
import * as sandboxApi from "@/entities/sandbox/api/sandbox-api";

vi.mock("@/entities/sandbox/api/sandbox-api", () => ({
  getSandboxStatus: vi.fn(),
  getSandboxProfiles: vi.fn(),
}));

describe("SandboxModeSwitch", () => {
  it("renders loaded sandbox status and opens dropdown", async () => {
    vi.mocked(sandboxApi.getSandboxStatus).mockResolvedValue({
      default_profile: "restricted-subprocess",
      available_profiles_count: 2,
      execution_backend: "sandbox",
    });

    vi.mocked(sandboxApi.getSandboxProfiles).mockResolvedValue([
      {
        name: "restricted-subprocess",
        runner: "subprocess",
        cpu_limit_seconds: 30,
        memory_limit_mb: 512,
        timeout_seconds: 60,
        network: "none",
        docker_image: "",
      },
      {
        name: "isolated-docker",
        runner: "docker",
        cpu_limit_seconds: 60,
        memory_limit_mb: 1024,
        timeout_seconds: 120,
        network: "bridge",
        docker_image: "alpine:latest",
      },
    ]);

    const wrapper = mount(SandboxModeSwitch);
    await flushPromises();

    expect(wrapper.find(".sandbox-switch__badge").exists()).toBe(true);
    expect(wrapper.find(".sandbox-switch__dropdown").exists()).toBe(false);

    await wrapper.find(".sandbox-switch__badge").trigger("click");
    expect(wrapper.find(".sandbox-switch__dropdown").exists()).toBe(true);

    const items = wrapper.findAll(".sandbox-switch__item");
    expect(items.length).toBe(2);

    await items[1].trigger("click");
    expect(wrapper.emitted("select")).toBeTruthy();
    expect(wrapper.emitted("select")?.[0]).toEqual(["isolated-docker"]);
  });
});
