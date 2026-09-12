import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent, h, provide, ref } from "vue";
import HistoryDetailPage from "../HistoryDetailPage.vue";
import { useUiStore } from "@/shared/store/ui";
import { useSettings } from "@/app/providers/useSettings";
import { useSwarmRunController, SWARM_RUN_CONTROLLER_KEY } from "@/features/swarm-run";
import { useGlobalSettings } from "@/features/global-settings/useGlobalSettings";
import { GLOBAL_SETTINGS_KEY } from "@/features/global-settings/globalSettingsContext";
import { useProjectFormActions, PROJECT_FORM_ACTIONS_KEY } from "@/entities/project-form";
import { APP_SETTINGS_KEY } from "@/entities/app-settings/contract";

const getLegacyTaskSnapshot = vi.fn();

vi.mock("@/shared/api/endpoints/tasks", () => ({
  getLegacyTaskSnapshot: (taskId: string) => getLegacyTaskSnapshot(taskId),
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

function createTestRouter(initialPath: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/history/:runId",
        component: { template: "<div />" },
        props: true,
      },
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
    },
    render() {
      return h(child, childProps);
    },
  });
}

describe("HistoryDetailPage — navigation and taskId resolution", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getLegacyTaskSnapshot.mockReset();
  });

  it("resolves history entry by taskId when navigated with backend task UUID", async () => {
    const ui = useUiStore();
    ui.historyList = [
      {
        id: "history-entry-uuid-1",
        taskId: "task-backend-uuid-1",
        at: Date.now(),
        prompt: "Prompt from history entry",
        agent_config: {},
        pipeline_steps: ["step1", "step2"],
        status: "completed",
      },
    ];

    const router = await createTestRouter("/history/task-backend-uuid-1");
    const host = makeHost(HistoryDetailPage, { runId: "task-backend-uuid-1" });
    const wrapper = mount(host, {
      global: {
        plugins: [router],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Prompt from history entry");
    wrapper.unmount();
  });

  it("falls back to remote task snapshot when not in historyList", async () => {
    getLegacyTaskSnapshot.mockResolvedValue({
      task_id: "unknown-task-id",
      status: "completed",
      prompt: "Remote task prompt preview",
      pipeline_steps: ["step_a", "step_b"],
      history: [],
    });

    const router = await createTestRouter("/history/unknown-task-id");
    const host = makeHost(HistoryDetailPage, { runId: "unknown-task-id" });
    const wrapper = mount(host, {
      global: {
        plugins: [router],
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 50));
    await wrapper.vm.$nextTick();

    expect(getLegacyTaskSnapshot).toHaveBeenCalledWith("unknown-task-id");
    expect(wrapper.text()).toContain("Remote task prompt preview");
    wrapper.unmount();
  });
});
