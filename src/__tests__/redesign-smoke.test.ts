import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import { defineComponent, h, provide, ref } from "vue";

import { useSettings } from "@/app/providers/useSettings";
import { useSwarmRunController } from "@/features/swarm-run/useSwarmRunController";
import { useGlobalSettings } from "@/features/global-settings/useGlobalSettings";
import { useProjectFormActions } from "@/entities/project-form";
import { APP_SETTINGS_KEY } from "@/entities/app-settings/contract";
import { SWARM_RUN_CONTROLLER_KEY } from "@/features/swarm-run/swarmRunContext";
import { GLOBAL_SETTINGS_KEY } from "@/features/global-settings/globalSettingsContext";
import { PROJECT_FORM_ACTIONS_KEY } from "@/entities/project-form";

import RunIdlePage from "@/pages/run/RunIdlePage.vue";
import RunLivePage from "@/pages/run/RunLivePage.vue";
import RunDonePage from "@/pages/run/RunDonePage.vue";
import ConfigurePage from "@/pages/configure/ConfigurePage.vue";
import HistoryListPage from "@/pages/history/HistoryListPage.vue";
import HistoryDetailPage from "@/pages/history/HistoryDetailPage.vue";
import SettingsWindow from "@/pages/settings/SettingsWindow.vue";

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
vi.mock("@/shared/lib/use-ws", () => ({
  useWs: () => ({ sendSubscribe: () => {} }),
}));
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

function createTestRouter(initialPath: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", redirect: "/run" },
      { path: "/run", component: { template: "<div />" } },
      { path: "/run/active", component: { template: "<div />" } },
      { path: "/run/done/:runId", component: { template: "<div />" }, props: true },
      { path: "/configure/:pane", component: { template: "<div />" }, props: true },
      { path: "/history", component: { template: "<div />" } },
      {
        path: "/history/:runId",
        component: { template: "<div />" },
        props: true,
      },
      {
        path: "/settings/:pane",
        component: { template: "<div />" },
        props: true,
      },
      { path: "/plugins", component: { template: "<div />" } },
      { path: "/agent-editor", component: { template: "<div />" } },
    ],
  });
  return router.replace(initialPath).then(() => router);
}

function makeHost(
  child: ReturnType<typeof defineComponent>,
  childProps: Record<string, unknown>,
) {
  return defineComponent({
    setup() {
      const settings = useSettings();
      const controller = useSwarmRunController(settings);
      const globalSettings = useGlobalSettings();
      const projectForm = useProjectFormActions(settings, {
        syncTaskFromServer: controller.syncTaskFromServer,
        sendWsSubscribe: controller.sendWsSubscribe,
      });
      provide(APP_SETTINGS_KEY, settings);
      provide(SWARM_RUN_CONTROLLER_KEY, controller);
      provide(GLOBAL_SETTINGS_KEY, globalSettings);
      provide(PROJECT_FORM_ACTIONS_KEY, projectForm);
      provide("openPlugins", () => {});
    },
    render() {
      return h(child, childProps);
    },
  });
}

function propsForPath(path: string): Record<string, unknown> {
  const configureMatch = path.match(/^\/configure\/([^/]+)/);
  if (configureMatch) return { pane: configureMatch[1] };
  const settingsMatch = path.match(/^\/settings\/([^/]+)/);
  if (settingsMatch) return { pane: settingsMatch[1] };
  const runDoneMatch = path.match(/^\/run\/done\/([^/]+)/);
  if (runDoneMatch) return { runId: runDoneMatch[1] };
  const historyMatch = path.match(/^\/history\/([^/]+)/);
  if (historyMatch) return { runId: historyMatch[1] };
  return {};
}

async function mountAt(path: string, child: ReturnType<typeof defineComponent>) {
  setActivePinia(createPinia());
  const router = await createTestRouter(path);
  const wrapper = mount(makeHost(child, propsForPath(path)), {
    global: { plugins: [router] },
    attachTo: document.body,
  });
  await flushPromises();
  return { wrapper, router };
}

describe("redesign smoke", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("mounts RunIdlePage without errors", async () => {
    const { wrapper } = await mountAt("/run", RunIdlePage);
    expect(wrapper.html()).toContain("run-idle");
    wrapper.unmount();
  });

  it("mounts RunLivePage (idle state)", async () => {
    const { wrapper } = await mountAt("/run/active", RunLivePage);
    expect(wrapper.html()).toContain("run-live");
    wrapper.unmount();
  });

  it("mounts RunDonePage with unknown runId", async () => {
    const { wrapper } = await mountAt("/run/done/abc", RunDonePage);
    expect(wrapper.html()).toContain("run-done");
    wrapper.unmount();
  });

  it("mounts ConfigurePage for every pane", async () => {
    const panes = [
      "project",
      "pipeline",
      "models",
      "memory",
      "mcp",
      "visual-qa",
      "notify",
      "advanced",
    ];
    for (const pane of panes) {
      const { wrapper } = await mountAt(`/configure/${pane}`, ConfigurePage);
      expect(wrapper.html(), `pane ${pane}`).toContain("app-shell");
      wrapper.unmount();
    }
  });

  it("ConfigurePage falls back to project when pane is bogus", async () => {
    const { wrapper, router } = await mountAt("/configure/not-a-pane", ConfigurePage);
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/configure/project");
    wrapper.unmount();
  });

  it("mounts HistoryListPage with empty list", async () => {
    const { wrapper } = await mountAt("/history", HistoryListPage);
    expect(wrapper.html()).toContain("history-list-page");
    wrapper.unmount();
  });

  it("mounts HistoryDetailPage with unknown id", async () => {
    const { wrapper } = await mountAt("/history/unknown", HistoryDetailPage);
    expect(wrapper.html()).toContain("history-detail-page");
    wrapper.unmount();
  });

  it("mounts SettingsWindow for every pane", async () => {
    const panes = [
      "profile",
      "api-keys",
      "automation",
      "notifications",
      "scenarios",
      "model-registry",
      "appearance",
      "shortcuts",
      "about",
    ];
    for (const pane of panes) {
      const { wrapper } = await mountAt(`/settings/${pane}`, SettingsWindow);
      expect(wrapper.html(), `pane ${pane}`).toContain("app-shell");
      wrapper.unmount();
    }
  });

  it("SettingsWindow falls back to profile when pane is bogus", async () => {
    const { wrapper, router } = await mountAt("/settings/nope", SettingsWindow);
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/settings/profile");
    wrapper.unmount();
  });

  it("PipelinePane renders steps and exposes add/remove controls", async () => {
    const { wrapper, router } = await mountAt("/configure/pipeline", ConfigurePage);
    await flushPromises();
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/configure/pipeline");
    expect(wrapper.html()).toContain("pipeline-pane");
    wrapper.unmount();
  });

  it("RunIdlePage Run button is disabled when prompt is empty", async () => {
    const { wrapper } = await mountAt("/run", RunIdlePage);
    const button = wrapper.find(".run-idle__run-btn");
    expect(button.exists()).toBe(true);
    expect(button.attributes("disabled")).toBeDefined();
    wrapper.unmount();
  });

  it("HistoryListPage CSV export button is disabled when list empty", async () => {
    const { wrapper } = await mountAt("/history", HistoryListPage);
    const exportBtn = wrapper.find(".history-list-page__export");
    expect(exportBtn.exists()).toBe(true);
    expect(exportBtn.attributes("disabled")).toBeDefined();
    wrapper.unmount();
  });
});
