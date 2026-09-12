import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";

const routerPush = vi.fn();
const uiStub = {
  taskId: null as string | null,
  taskStatus: null as string | null,
  taskError: null as unknown,
  taskHistory: [] as unknown[],
  historyList: [] as unknown[],
  runAvailability: null,
  runAvailabilityError: null,
};

vi.mock("vue-router", () => ({ useRouter: () => ({ push: routerPush }) }));
vi.mock("@/shared/store/ui", () => ({ useUiStore: () => uiStub }));
vi.mock("@/widgets/header/useAppHeaderBindings", () => ({
  useAppHeaderBindings: () => ({ isRunning: computed(() => false) }),
}));
vi.mock("@/features/pattern-memory/usePatternMemoryHint", () => ({
  usePatternMemoryHint: () => ({ hint: ref(null) }),
}));
vi.mock("@/features/slash-commands/useSlashCommandRunner", () => ({
  useSlashCommandRunner: () => ({
    tryRun: vi.fn(),
    lastOutcome: ref(null),
    lastError: ref(null),
  }),
}));
vi.mock("@/features/run-recovery", () => ({
  useRunRecovery: () => ({
    isRunUnavailable: computed(() => false),
    resetUnavailableRun: vi.fn(),
  }),
}));
vi.mock("@/entities/scenario", () => ({
  useScenarioCatalog: () => ({ scenarios: ref([]) }),
}));
vi.mock("@/shared/lib/i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));

import { useRunIdleHandlers } from "./useRunIdleHandlers";

type Settings = Parameters<typeof useRunIdleHandlers>[0];
type Controller = Parameters<typeof useRunIdleHandlers>[1];

function makeSettings(): Settings {
  return {
    form: {
      prompt: "",
      scenario_id: null,
      favorite_scenarios: [],
      custom_scenarios: [],
    },
    saveSettingsSoon: vi.fn(),
    flushSaveAsync: vi.fn(async () => {}),
    pipelineState: { steps: ref([]), applyStepIds: vi.fn() },
  } as unknown as Settings;
}

function makeController(onStartRun: () => Promise<void>): Controller {
  return { onStartRun: vi.fn(onStartRun), sendWsSubscribe: vi.fn() } as Controller;
}

describe("useRunIdleHandlers — playbook run", () => {
  beforeEach(() => {
    routerPush.mockClear();
    uiStub.taskId = null;
    uiStub.taskStatus = null;
  });

  it("starts a real pipeline run with the playbook prompt and scenario", async () => {
    const settings = makeSettings();
    const controller = makeController(async () => {
      uiStub.taskId = "task-live-1";
      uiStub.taskStatus = "in_progress";
    });
    const handlers = useRunIdleHandlers(settings, controller);

    await handlers.onPlaybookStarted({
      prompt: "Playbook: Database Schema Migration",
      scenario_id: "build_feature",
    });

    expect(settings.form.prompt).toBe("Playbook: Database Schema Migration");
    expect(settings.form.scenario_id).toBe("build_feature");
    expect(settings.flushSaveAsync).toHaveBeenCalledTimes(1);
    expect(controller.onStartRun).toHaveBeenCalledTimes(1);
    expect(routerPush).toHaveBeenCalledWith("/run/active");
    expect(routerPush).not.toHaveBeenCalledWith(expect.stringContaining("/history/"));
  });

  it("surfaces a failed start instead of navigating to a run that never began", async () => {
    const settings = makeSettings();
    const failure = new Error("provider unavailable");
    const controller = makeController(async () => {
      throw failure;
    });
    const handlers = useRunIdleHandlers(settings, controller);

    await handlers.onPlaybookStarted({
      prompt: "Playbook: Dependency Upgrade",
      scenario_id: "fix_bug",
    });

    expect(uiStub.taskError).toBe(failure);
    expect(routerPush).not.toHaveBeenCalled();
  });

  it("puts an imported issue into the prompt without starting a run", () => {
    const settings = makeSettings();
    const controller = makeController(async () => {});
    const handlers = useRunIdleHandlers(settings, controller);

    handlers.onIssueImported({ prompt: "Source: GITHUB Issue\nTitle: Bug in API" });

    expect(settings.form.prompt).toContain("Bug in API");
    expect(controller.onStartRun).not.toHaveBeenCalled();
  });
});
