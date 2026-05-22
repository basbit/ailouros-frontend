import { computed, onActivated, onDeactivated, ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { HistoryGlimpseEntry } from "@/widgets/run-idle/HistoryGlimpse.vue";
import { useAppHeaderBindings } from "@/widgets/header/useAppHeaderBindings";
import { usePatternMemoryHint } from "@/features/pattern-memory/usePatternMemoryHint";
import { useUiStore } from "@/shared/store/ui";
import { useI18n } from "@/shared/lib/i18n";
import { formatDurationShort, formatRelativeShort } from "@/shared/lib/format-relative";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const AWAITING_STATUSES = new Set<string>([
  "awaiting_human",
  "awaiting_shell_confirm",
  "awaiting_manual_shell",
  "blocked",
]);

const ACTIVE_STATUSES = new Set<string>([
  "awaiting_human",
  "awaiting_shell_confirm",
  "awaiting_manual_shell",
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
}

export function useRunIdleHandlers(
  settings: InjectedSettingsLike,
  controller: InjectedControllerLike,
) {
  const router = useRouter();
  const ui = useUiStore();
  const header = useAppHeaderBindings();
  const { t } = useI18n();

  const pipelineSteps = computed<string[]>(() => {
    const fromState = settings.pipelineState.steps.value;
    if (!Array.isArray(fromState)) return [];
    return fromState.map((step) => step.id);
  });

  const canRun = computed(() => settings.form.prompt.trim().length > 0);
  const isStarting = ref(false);

  const activeGateBanner = computed<boolean>(() => {
    if (!ui.taskId) return false;
    return ACTIVE_STATUSES.has(ui.taskStatus ?? "");
  });

  const isAwaitingGate = computed<boolean>(() => {
    if (!ui.taskId) return false;
    return AWAITING_STATUSES.has(ui.taskStatus ?? "");
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

  function onOpenConfigure(): void {
    void router.push("/configure/pipeline");
  }

  function onOpenActiveRun(): void {
    const taskId = (ui.taskId ?? "").trim();
    if (taskId) {
      const entry = ui.historyList.find((item) => (item.taskId ?? "") === taskId);
      if (entry) {
        void router.push(`/history/${entry.id}`);
        return;
      }
    }
    void router.push("/history");
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
    if (status === "completed") return "ok";
    if (status === "failed" || status === "cancelled") return "fail";
    if (status === "running") return "run";
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

  async function onStart(): Promise<void> {
    if (!canRun.value || header.isRunning.value || isStarting.value) return;
    isStarting.value = true;
    try {
      await settings.flushSaveAsync();
      controller.onStartRun().catch((err) => {
        frontendLogger.warn("controller.onStartRun failed", err);
      });
    } finally {
      isStarting.value = false;
    }
  }

  function handleRunShortcut(event: KeyboardEvent): void {
    const isMod = event.metaKey || event.ctrlKey;
    if (!isMod || event.key !== "Enter") return;
    event.preventDefault();
    void onStart();
  }

  onActivated(() => {
    window.addEventListener("keydown", handleRunShortcut);
  });

  onDeactivated(() => {
    window.removeEventListener("keydown", handleRunShortcut);
  });

  watch(
    () => settings.form.prompt,
    () => {
      settings.saveSettingsSoon();
    },
  );

  return {
    ui,
    header,
    pipelineSteps,
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
    onOpenConfigure,
    onOpenActiveRun,
    onOpenHistory,
    onSelectHistoryRun,
    onApplyPatternHint,
    onDismissPatternHint,
    onStart,
  };
}
