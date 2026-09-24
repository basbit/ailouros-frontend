import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent, h, provide, ref } from "vue";
import HistoryListPage from "../HistoryListPage.vue";
import { useUiStore, type HistoryEntry } from "@/shared/store/ui";
import { usePreferencesStore } from "@/shared/store/preferences";
import { historyEn } from "@/shared/lib/i18n/history";
import { useSettings } from "@/app/providers/useSettings";
import { useSwarmRunController, SWARM_RUN_CONTROLLER_KEY } from "@/features/swarm-run";
import { useGlobalSettings } from "@/features/global-settings/useGlobalSettings";
import { GLOBAL_SETTINGS_KEY } from "@/features/global-settings/globalSettingsContext";
import { useProjectFormActions, PROJECT_FORM_ACTIONS_KEY } from "@/entities/project-form";
import { APP_SETTINGS_KEY } from "@/entities/app-settings/contract";
import type { ServerRunListing, ServerRunRow } from "@/shared/api/endpoints/run-history";

const listServerRuns = vi.fn();

vi.mock("@/shared/api/endpoints/run-history", () => ({
  listServerRuns: (input: unknown) => listServerRuns(input),
}));

vi.mock("@/shared/api/http", () => ({
  httpGet: vi.fn().mockResolvedValue({ can_resume: false }),
}));

vi.mock("@/features/system-health/useSystemHealth", () => ({
  useSystemHealth: () => ({
    status: ref("healthy"),
    subsystems: ref([]),
    loading: ref(false),
    error: ref(null),
    notImplemented: ref(false),
    lastUpdatedAt: ref(null),
    reload: vi.fn().mockResolvedValue(undefined),
  }),
}));

function serverRun(overrides: Partial<ServerRunRow> = {}): ServerRunRow {
  return {
    taskId: "server-only-task",
    createdAt: "2026-09-16T10:00:00.000Z",
    updatedAt: "2026-09-16T10:04:00.000Z",
    prompt: "a run recorded on the server",
    promptTruncated: false,
    scenarioId: "fix_bug",
    scenarioTitle: "Fix a bug",
    status: "completed",
    pipelineSteps: ["dev", "qa"],
    workspaceRoot: "/tmp/project-a",
    hasPipelineSnapshot: true,
    ...overrides,
  };
}

function listing(runs: ServerRunRow[]): ServerRunListing {
  return { runs, total: runs.length, unreadable: 0 };
}

function localEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "local-entry",
    at: Date.parse("2026-09-16T09:00:00.000Z"),
    prompt: "a run this browser started",
    agent_config: {},
    pipeline_steps: ["dev"],
    taskId: "local-only-task",
    status: "completed",
    ...overrides,
  };
}

function makeHost() {
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
    },
    render() {
      return h(HistoryListPage);
    },
  });
}

async function mountHistory(local: HistoryEntry[] = []) {
  usePreferencesStore().locale = "en";
  const ui = useUiStore();
  ui.historyList = local;
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/history", component: { template: "<div />" } },
      { path: "/history/:runId", component: { template: "<div />" }, props: true },
    ],
  });
  await router.replace("/history");
  const wrapper = mount(makeHost(), { global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
}

describe("History list — runs merged with the server's own record", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    listServerRuns.mockReset();
  });

  it("shows a run localStorage never saw", async () => {
    listServerRuns.mockResolvedValue(listing([serverRun()]));

    const wrapper = await mountHistory([]);

    expect(wrapper.text()).toContain("a run recorded on the server");
    expect(wrapper.text()).not.toContain(historyEn["history.list.empty"]);
    wrapper.unmount();
  });

  it("keeps local-only runs next to the server's runs, without duplicating", async () => {
    listServerRuns.mockResolvedValue(
      listing([serverRun(), serverRun({ taskId: "local-only-task" })]),
    );

    const wrapper = await mountHistory([localEntry()]);

    const text = wrapper.text();
    expect(text).toContain("a run recorded on the server");
    expect(text).toContain("a run this browser started");
    expect(text.split("a run this browser started")).toHaveLength(2);
    wrapper.unmount();
  });

  it("filters the merged list by the search box", async () => {
    listServerRuns.mockResolvedValue(listing([serverRun()]));

    const wrapper = await mountHistory([localEntry()]);
    await wrapper.find(".history-list-page__search").setValue("recorded on the server");

    const text = wrapper.text();
    expect(text).toContain("a run recorded on the server");
    expect(text).not.toContain("a run this browser started");
    wrapper.unmount();
  });

  it("filters the merged list by status", async () => {
    listServerRuns.mockResolvedValue(listing([serverRun({ status: "failed" })]));

    const wrapper = await mountHistory([localEntry()]);
    await wrapper.find(".history-list-page__filter").setValue("failed");

    const text = wrapper.text();
    expect(text).toContain("a run recorded on the server");
    expect(text).not.toContain("a run this browser started");
    wrapper.unmount();
  });

  it("says the backend is unreachable instead of claiming there are no runs", async () => {
    listServerRuns.mockRejectedValue(new Error("Failed to fetch"));

    const wrapper = await mountHistory([]);

    const text = wrapper.text();
    expect(text).toContain(historyEn["history.list.serverUnreachableEmpty"]);
    expect(text).toContain("Failed to fetch");
    expect(text).not.toContain(historyEn["history.list.empty"]);
    wrapper.unmount();
  });

  it("warns that the list is partial when the backend fails but local runs exist", async () => {
    listServerRuns.mockRejectedValue(new Error("Failed to fetch"));

    const wrapper = await mountHistory([localEntry()]);

    const text = wrapper.text();
    expect(text).toContain(historyEn["history.list.serverUnreachableBanner"]);
    expect(text).toContain("a run this browser started");
    wrapper.unmount();
  });

  it("reports an empty history only when the backend answered with no runs", async () => {
    listServerRuns.mockResolvedValue(listing([]));

    const wrapper = await mountHistory([]);

    expect(wrapper.text()).toContain(historyEn["history.list.empty"]);
    wrapper.unmount();
  });

  it("shows a loading state until the first listing lands", async () => {
    let release: (value: ServerRunListing) => void = () => {};
    listServerRuns.mockReturnValue(
      new Promise<ServerRunListing>((resolve) => {
        release = resolve;
      }),
    );

    const wrapper = await mountHistory([]);
    expect(wrapper.text()).toContain(historyEn["history.list.loading"]);

    release(listing([serverRun()]));
    await flushPromises();

    expect(wrapper.text()).not.toContain(historyEn["history.list.loading"]);
    expect(wrapper.text()).toContain("a run recorded on the server");
    wrapper.unmount();
  });

  it("asks the backend once per mount", async () => {
    listServerRuns.mockResolvedValue(listing([]));

    const wrapper = await mountHistory([]);

    expect(listServerRuns).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });
});
