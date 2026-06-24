import { computed, reactive, watch } from "vue";
import type { ComputedRef } from "vue";
import { useRouter } from "vue-router";
import { type PipelineStepRow } from "@/features/pipeline/PipelineStepEditor.vue";
import { pipelineOptionsAll } from "@/features/pipeline/usePipeline";
import { TOPOLOGY_PRESETS, type TopologyId } from "@/features/pipeline/topologyPresets";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useI18n } from "@/shared/lib/i18n";

const TOPOLOGY_IDS: readonly TopologyId[] = ["ring", "mesh"];

function coerceTopology(raw: unknown): TopologyId {
  return (TOPOLOGY_IDS as readonly string[]).includes(raw as string)
    ? (raw as TopologyId)
    : "ring";
}

interface FormState {
  id: string;
  title: string;
  steps: PipelineStepRow[];
  workspaceWriteDefault: boolean;
  topology: TopologyId;
}

export function useScenarioForm(scenarioId: () => string | undefined) {
  const settings = useInjectedAppSettings();
  const router = useRouter();
  const { t } = useI18n();

  const customScenarios = computed(() => settings.form.custom_scenarios ?? []);
  const customRoles = computed(() => settings.customRolesState.customRoles.value);

  const stepOptions = computed<[string, string][]>(() =>
    pipelineOptionsAll(customRoles.value),
  );

  const topologyOptions = computed(() =>
    TOPOLOGY_IDS.map((id) => ({ id, label: TOPOLOGY_PRESETS[id].label })),
  );

  const isEditMode = computed(() => Boolean(scenarioId()));

  let uidCounter = 0;
  function makeUid(): string {
    uidCounter += 1;
    return `s-${Date.now().toString(36)}-${uidCounter}`;
  }

  const form = reactive<FormState>({
    id: "",
    title: "",
    steps: [],
    workspaceWriteDefault: false,
    topology: "ring",
  });

  const existingIds = computed<string[]>(() =>
    customScenarios.value.map((entry) => entry.id),
  );

  const validationError = computed<string | null>(() => {
    const trimmedId = form.id.trim();
    if (!trimmedId) return t("settings.scenarios.editor.validationId");
    if (!isEditMode.value && existingIds.value.includes(trimmedId)) {
      return t("settings.scenarios.editor.validationId");
    }
    if (form.steps.length === 0) {
      return t("settings.scenarios.editor.validationSteps");
    }
    return null;
  });

  const pageTitle = computed(() =>
    isEditMode.value
      ? t("settings.scenarios.editor.titleEdit")
      : t("settings.scenarios.editor.titleNew"),
  );

  function hydrate(): void {
    if (!scenarioId()) {
      form.id = "";
      form.title = "";
      form.steps = [];
      form.workspaceWriteDefault = false;
      form.topology = "ring";
      return;
    }
    const entry = customScenarios.value.find((item) => item.id === scenarioId());
    if (!entry) {
      void router.replace("/settings/scenarios");
      return;
    }
    form.id = entry.id;
    form.title = entry.title;
    form.steps = entry.pipeline_steps.map((stepId) => ({ uid: makeUid(), id: stepId }));
    form.workspaceWriteDefault = entry.workspace_write_default;
    form.topology = coerceTopology(entry.topology);
  }

  watch(scenarioId, hydrate, { immediate: true });

  function onAddStep(): void {
    const fallbackOption = stepOptions.value[0];
    if (!fallbackOption) {
      throw new Error("scenario-edit: pipeline step options are empty");
    }
    form.steps = [...form.steps, { uid: makeUid(), id: fallbackOption[0] }];
  }

  function onRemoveStep(index: number): void {
    form.steps = form.steps.filter((_, idx) => idx !== index);
  }

  function onMoveStep(index: number, delta: number): void {
    const target = index + delta;
    if (target < 0 || target >= form.steps.length) return;
    const next = form.steps.slice();
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    form.steps = next;
  }

  function onUpdateStep(index: number, nextId: string): void {
    const next = form.steps.slice();
    if (!next[index]) return;
    next[index] = { ...next[index], id: nextId };
    form.steps = next;
  }

  function onCancel(): void {
    void router.push("/settings/scenarios");
  }

  function onSave(): void {
    if (validationError.value) return;
    const trimmedId = form.id.trim();
    const next = customScenarios.value.slice();
    const idx = next.findIndex((entry) => entry.id === trimmedId);
    const payload = {
      id: trimmedId,
      title: form.title.trim() || trimmedId,
      pipeline_steps: form.steps.map((row) => row.id),
      workspace_write_default: form.workspaceWriteDefault,
      topology: form.topology,
    };
    if (idx >= 0) {
      next[idx] = payload;
    } else {
      next.push(payload);
    }
    settings.form.custom_scenarios = next;
    settings.saveSettingsSoon();
    void router.push("/settings/scenarios");
  }

  return {
    form,
    stepOptions,
    topologyOptions,
    isEditMode,
    validationError,
    pageTitle,
    onAddStep,
    onRemoveStep,
    onMoveStep,
    onUpdateStep,
    onCancel,
    onSave,
  } as {
    form: FormState;
    stepOptions: ComputedRef<[string, string][]>;
    topologyOptions: ComputedRef<{ id: TopologyId; label: string }[]>;
    isEditMode: ComputedRef<boolean>;
    validationError: ComputedRef<string | null>;
    pageTitle: ComputedRef<string>;
    onAddStep: () => void;
    onRemoveStep: (index: number) => void;
    onMoveStep: (index: number, delta: number) => void;
    onUpdateStep: (index: number, nextId: string) => void;
    onCancel: () => void;
    onSave: () => void;
  };
}
