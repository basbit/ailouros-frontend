import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { HistoryGlimpseEntry } from "@/widgets/run-idle/HistoryGlimpse.vue";
import { useAppHeaderBindings } from "@/widgets/header/useAppHeaderBindings";
import { usePatternMemoryHint } from "@/features/pattern-memory/usePatternMemoryHint";
import { useSlashCommandRunner } from "@/features/slash-commands/useSlashCommandRunner";
import { useRunRecovery } from "@/features/run-recovery";
import { useRunEcosystemHandlers } from "@/pages/run/useRunEcosystemHandlers";
import { useRunShortcut } from "@/pages/run/useRunShortcut";
import { useUiStore } from "@/shared/store/ui";
import { useScenarioCatalog } from "@/entities/scenario";
import { CUSTOM_SCENARIO_ID } from "@/shared/lib/swarm-ui-constants";
import { defaultPipelineOrder } from "@/entities/pipeline";
import { useI18n } from "@/shared/lib/i18n";
import { formatDurationShort, formatRelativeShort } from "@/shared/lib/format-relative";
import { frontendLogger } from "@/shared/lib/frontend-logger";
import { tryParseDispatchOrQuick } from "@/shared/lib/slash-commands";
import { AWAITING_TASK_STATUSES, isTaskAwaiting } from "@/shared/lib/task-status";

const ACTIVE_STATUSES = new Set<string>([
  ...AWAITING_TASK_STATUSES,
  "blocked",
  "running",
  "in_progress",
]);

interface InjectedSettingsLike {
  form: {
    prompt: string;
    scenario_id: string | null;
    favorite_scenarios: string[];
    custom_scenarios: unknown[];
    workspace_root?: string;
  };
  saveSettingsSoon: () => void;
  flushSaveAsync: () => Promise<void>;
  pipelineState: {
    steps: { value: { id: string }[] };
    applyStepIds: (ids: string[]) => void;
  };
}

interface InjectedControllerLike {
  onStartRun: () => Promise<void>;
  sendWsSubscribe: () => void;
}

export function useRunIdleHandlers(
  settings: InjectedSettingsLike,
  controller: InjectedControllerLike,
) {
  const router = useRouter();
  const ui = useUiStore();
  const header = useAppHeaderBindings();
  const { t } = useI18n();
  const { isRunUnavailable, resetUnavailableRun } = useRunRecovery({
    sendWsSubscribe: controller.sendWsSubscribe,
  });

  const scenarioCatalog = useScenarioCatalog();

  interface ScenarioPipelineResolution {
    steps: string[];
    /**
     * True when a selected scenario determines these steps, or when the
     * pipeline-graph page has been edited away from the untouched default
     * catalogue. False only for the untouched catalogue itself, which is
     * not a plan — it's just every step the app knows about.
     */
    planned: boolean;
  }

  function isUntouchedDefaultPipeline(stepIds: string[]): boolean {
    const catalogue = defaultPipelineOrder();
    if (stepIds.length !== catalogue.length) return false;
    return stepIds.every((id, index) => id === catalogue[index]);
  }

  const scenarioPipelineResolution = computed<ScenarioPipelineResolution>(() => {
    const scenarioId = (settings.form.scenario_id ?? "").trim();
    if (scenarioId && scenarioId !== CUSTOM_SCENARIO_ID) {
      const fromCatalog = scenarioCatalog.scenarios.value.find(
        (entry) => entry.id === scenarioId,
      );
      if (fromCatalog) return { steps: fromCatalog.pipeline_steps, planned: true };
      const custom = (
        settings.form.custom_scenarios as Array<{
          id?: string;
          pipeline_steps?: string[];
        }>
      ).find((entry) => entry?.id === scenarioId);
      if (custom && Array.isArray(custom.pipeline_steps)) {
        return { steps: custom.pipeline_steps, planned: true };
      }
    }
    const fromState = settings.pipelineState.steps.value;
    const steps = Array.isArray(fromState) ? fromState.map((step) => step.id) : [];
    return { steps, planned: !isUntouchedDefaultPipeline(steps) };
  });

  const pipelineSteps = computed<string[]>(
    () => scenarioPipelineResolution.value.steps,
  );
  const hasPlannedPipeline = computed<boolean>(
    () => scenarioPipelineResolution.value.planned,
  );

  const canRun = computed(() => settings.form.prompt.trim().length > 0);
  const isStarting = ref(false);

  const activeGateBanner = computed<boolean>(() => {
    if (!ui.taskId) return false;
    return ACTIVE_STATUSES.has(ui.taskStatus ?? "");
  });

  const isAwaitingGate = computed<boolean>(() => {
    if (!ui.taskId) return false;
    const status = ui.taskStatus ?? "";
    return isTaskAwaiting(status) || status === "blocked";
  });

  const latestLogMessage = computed<string>(() => {
    const history = ui.taskHistory as Array<{ message?: string; agent?: string }>;
    if (!Array.isArray(history) || !history.length) return "";
    const last = history[history.length - 1];
    const text = (last?.message ?? "").trim();
    if (!text) return "";
    const prefix = last?.agent ? `${last.agent}: ` : "";
    return `${prefix}${text}`;
  });

  function onScenarioPick(value: string | null): void {
    settings.form.scenario_id = value || null;
    settings.saveSettingsSoon();
  }

  function onScenarioFavoriteToggle(scenarioId: string): void {
    const favorites = new Set(settings.form.favorite_scenarios ?? []);
    if (favorites.has(scenarioId)) favorites.delete(scenarioId);
    else favorites.add(scenarioId);
    settings.form.favorite_scenarios = Array.from(favorites);
    settings.saveSettingsSoon();
  }

  const scenarioPickerOpen = ref(false);

  function onOpenScenarioLibrary(): void {
    scenarioPickerOpen.value = true;
  }

  function onOpenScenarioSettings(): void {
    scenarioPickerOpen.value = false;
    void router.push("/settings/scenarios");
  }

  function onOpenActiveRun(): void {
    void router.push("/run/active");
  }

  function onOpenHistory(): void {
    void router.push("/history");
  }

  function onSelectHistoryRun(id: string): void {
    void router.push(`/history/${id}`);
  }

  const dismissedHintIds = ref<Set<string>>(new Set());

  const { hint: patternHint } = usePatternMemoryHint({
    prompt: computed(() => settings.form.prompt),
    currentPipelineSteps: pipelineSteps,
    history: computed(() => ui.historyList),
    dismissed: computed(() => dismissedHintIds.value),
  });

  const patternHintMessage = computed(() =>
    patternHint.value
      ? t("patternMemory.suggestPipeline", {
          count: patternHint.value.pipelineSteps.length,
        })
      : "",
  );

  function onApplyPatternHint(): void {
    if (!patternHint.value) return;
    settings.pipelineState.applyStepIds(patternHint.value.pipelineSteps);
    dismissedHintIds.value = new Set([
      ...dismissedHintIds.value,
      patternHint.value.source.id,
    ]);
  }

  function onDismissPatternHint(): void {
    if (!patternHint.value) return;
    dismissedHintIds.value = new Set([
      ...dismissedHintIds.value,
      patternHint.value.source.id,
    ]);
  }

  function mapHistoryStatus(status: string | null): HistoryGlimpseEntry["status"] {
    if (status === "completed" || status === "completed_no_writes") return "ok";
    if (status === "failed" || status === "cancelled") return "fail";
    if (status === "running" || status === "in_progress") return "run";
    return "warn";
  }

  const historyItems = computed<HistoryGlimpseEntry[]>(() =>
    ui.historyList.slice(0, 12).map((entry) => ({
      id: entry.id,
      title: (entry.prompt || entry.id).split("\n")[0],
      status: mapHistoryStatus(entry.status ?? null),
      timestamp: formatRelativeShort(entry.startedAt ?? entry.at),
      duration: formatDurationShort(entry.durationMs ?? null),
      stepCount: entry.pipeline_steps?.length,
    })),
  );

  const slashRunner = useSlashCommandRunner();

  async function onStart(): Promise<void> {
    if (!canRun.value || isStarting.value) return;
    isStarting.value = true;
    try {
      const slashIntent = tryParseDispatchOrQuick(settings.form.prompt);
      if (slashIntent) {
        try {
          await slashRunner.tryRun(settings.form.prompt, {
            scenario: settings.form.scenario_id ?? "default",
          });
        } catch (slashError: unknown) {
          frontendLogger.warn("slash command failed", slashError);
        }
        return;
      }
      await settings.flushSaveAsync();
      await controller.onStartRun();
      const activeStatuses = ["running", "in_progress", "awaiting_human"];
      if (ui.taskId && activeStatuses.includes(ui.taskStatus ?? "")) {
        void router.push("/run/active");
      }
    } catch (startError: unknown) {
      frontendLogger.error("run start failed", startError);
      ui.taskError = startError;
    } finally {
      isStarting.value = false;
    }
  }

  const { onPlaybookStarted, onIssueImported } = useRunEcosystemHandlers(
    settings,
    onStart,
  );

  useRunShortcut(onStart);

  watch(
    () => settings.form.prompt,
    () => {
      settings.saveSettingsSoon();
    },
  );

  watch(
    () => ui.taskStatus,
    (status) => {
      const activeStatuses = ["running", "in_progress", "awaiting_human"];
      if (ui.taskId && activeStatuses.includes(status ?? "")) {
        void router.push("/run/active");
      }
    },
  );

  return {
    ui,
    header,
    pipelineSteps,
    hasPlannedPipeline,
    canRun,
    isStarting,
    activeGateBanner,
    isAwaitingGate,
    latestLogMessage,
    scenarioPickerOpen,
    patternHint,
    patternHintMessage,
    historyItems,
    onScenarioPick,
    onScenarioFavoriteToggle,
    onOpenScenarioLibrary,
    onOpenScenarioSettings,
    onOpenActiveRun,
    onOpenHistory,
    onSelectHistoryRun,
    onApplyPatternHint,
    onDismissPatternHint,
    onStart,
    onPlaybookStarted,
    onIssueImported,
    slashRunner,
    isRunUnavailable,
    onResetUnavailableRun: resetUnavailableRun,
  };
}
