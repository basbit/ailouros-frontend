import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";

import App from "@/app/App.vue";
import { router } from "@/app/router";

vi.mock("@/shared/api/endpoints/scenarios", () => ({
  listScenarios: vi.fn().mockResolvedValue({ scenarios: [] }),
}));
vi.mock("@/shared/api/endpoints/project-settings", () => ({
  loadProjectSettings: vi.fn().mockResolvedValue(null),
  saveProjectSettings: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/shared/api/endpoints/runtime", () => ({
  fetchRuntimeCapabilities: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/shared/api/endpoints/tasks-runtime", () => ({
  cancelTask: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/shared/api/endpoints/user-settings", () => ({
  loadUserSettings: vi.fn().mockResolvedValue({}),
  saveUserSettings: vi.fn().mockResolvedValue({}),
  getGlobalSearchKeys: vi.fn().mockResolvedValue({}),
  setGlobalSearchKey: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/shared/lib/use-ws", () => ({
  useWs: () => ({ sendSubscribe: () => {} }),
}));
vi.mock("@/shared/lib/use-swarm-defaults", async () => {
  const actual = await vi.importActual<
    typeof import("@/shared/lib/use-swarm-defaults")
  >("@/shared/lib/use-swarm-defaults");
  return {
    ...actual,
    useSwarmDefaults: () => ({ defaults: { value: null } }),
  };
});
vi.mock("@/features/system-health/useSystemHealth", () => ({
  useSystemHealth: () => ({
    status: ref("ok"),
    subsystems: ref([]),
    loading: ref(false),
    error: ref(null),
    notImplemented: ref(false),
    lastUpdatedAt: ref(null),
    reload: vi.fn().mockResolvedValue(undefined),
  }),
}));
vi.mock("@/widgets/update-banner/UpdateBanner.vue", () => ({
  default: { template: "<div />" },
}));

const ROUTES_TO_VISIT = [
  "/run",
  "/run/active",
  "/run/done/task-x",
  "/configure/project",
  "/configure/pipeline",
  "/configure/models",
  "/configure/memory",
  "/configure/mcp",
  "/configure/visual-qa",
  "/configure/notify",
  "/configure/advanced",
  "/history",
  "/history/run-x",
  "/settings/profile",
  "/settings/api-keys",
  "/settings/automation",
  "/settings/notifications",
  "/settings/scenarios",
  "/settings/model-registry",
  "/settings/appearance",
  "/settings/shortcuts",
  "/settings/about",
];

describe("redesign e2e — real App + real router", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("mounts App and renders /run", async () => {
    await router.push("/run");
    await flushPromises();
    const wrapper = mount(App, {
      global: { plugins: [router] },
      attachTo: document.body,
    });
    await flushPromises();
    await flushPromises();
    expect(wrapper.html()).toContain("run-idle");
    wrapper.unmount();
  });

  it("navigates through every redesigned route without crashing", async () => {
    await router.push("/run");
    const wrapper = mount(App, {
      global: { plugins: [router] },
      attachTo: document.body,
    });
    await flushPromises();
    const errors: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(args.map((a) => String(a)).join(" "));
    };
    try {
      for (const target of ROUTES_TO_VISIT) {
        await router.push(target);
        await flushPromises();
        await flushPromises();
        expect(router.currentRoute.value.matched.length, target).toBeGreaterThan(0);
      }
    } finally {
      console.error = originalError;
    }
    const meaningful = errors.filter(
      (e) =>
        !e.includes("[Vue warn]") &&
        !e.includes("ResizeObserver") &&
        !e.includes("Not implemented: HTMLCanvasElement"),
    );
    expect(meaningful, meaningful.join("\n")).toEqual([]);
    wrapper.unmount();
  });

  it("⌘K opens the command palette", async () => {
    await router.push("/run");
    const wrapper = mount(App, {
      global: { plugins: [router] },
      attachTo: document.body,
    });
    await flushPromises();
    expect(document.body.querySelector(".command-palette__dialog")).toBeNull();
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
    );
    await flushPromises();
    expect(document.body.querySelector(".command-palette__dialog")).not.toBeNull();
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
    );
    await flushPromises();
    expect(document.body.querySelector(".command-palette__dialog")).toBeNull();
    wrapper.unmount();
  });

  it("⌘, navigates to settings", async () => {
    await router.push("/run");
    const wrapper = mount(App, {
      global: { plugins: [router] },
      attachTo: document.body,
    });
    await flushPromises();
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: ",",
        metaKey: true,
        bubbles: true,
      }),
    );
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/settings/profile");
    wrapper.unmount();
  });

  it("escape closes command palette", async () => {
    await router.push("/run");
    const wrapper = mount(App, {
      global: { plugins: [router] },
      attachTo: document.body,
    });
    await flushPromises();
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
    );
    await flushPromises();
    const input = document.body.querySelector<HTMLInputElement>(
      ".command-palette__input",
    );
    expect(input).not.toBeNull();
    input?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await flushPromises();
    expect(document.body.querySelector(".command-palette__dialog")).toBeNull();
    wrapper.unmount();
  });
});
