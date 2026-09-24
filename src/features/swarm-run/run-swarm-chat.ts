import { startSwarmChatStream } from "@/shared/api/endpoints/onboarding";
import { listScenarios } from "@/shared/api/endpoints/scenarios";
import {
  agentConfigErrorMessage,
  buildAgentConfig,
  type RunSwarmChatSettings,
} from "@/entities/agent-config";
import { type ChatStreamEvent } from "@/shared/lib/chat-stream-events";
import { useI18n } from "@/shared/lib/i18n";
import {
  analyzePipelineStepOrder,
  formatStepOrderSummary,
  roleRefForStep,
} from "@/entities/pipeline";
import { consumeSseStream } from "@/shared/lib/swarm-chat-stream";
import { useUxStore } from "@/shared/store/ux";
import type { ScenarioInputKey, ScenarioSummary } from "@/shared/model/scenario-types";

const CLARIFY_INPUT_STEP_ID = "clarify_input";
const SWARM_CHAT_MODEL_ID = "swarm-local";
const TASK_ID_HEADER = "x-task-id";

type Translator = ReturnType<typeof useI18n>["t"];

export interface ResolvedScenario {
  scenario: ScenarioSummary;
  isCustom: boolean;
}

type ScenarioResolver = (scenarioId: string) => Promise<ResolvedScenario | null>;

export interface RunSwarmChatOptions {
  signal?: AbortSignal;
  resolveScenario?: ScenarioResolver;
}

interface RunSwarmChatHandlers {
  /** `pipelineSteps` are the steps the run actually executes (a selected
   *  scenario owns them), so callers record the real pipeline, not the editor's. */
  onTaskId: (taskId: string, pipelineSteps: string[]) => void;
  onDone: () => void;
  sendWsSubscribe: () => void;
  onEvent?: (event: ChatStreamEvent) => void;
  onWarning?: (message: string) => void;
}

interface NormalizedForm {
  workspaceRoot: string;
  projectContextFile: string;
  scenarioId: string;
}

interface PipelineSelection {
  stepIds: string[];
  stages: string[][];
  hasParallelStages: boolean;
}

async function fetchScenarioById(scenarioId: string): Promise<ResolvedScenario | null> {
  const list = await listScenarios();
  const scenario = list.scenarios.find((entry) => entry.id === scenarioId) ?? null;
  return scenario ? { scenario, isCustom: false } : null;
}

function findMissingRequiredScenarioInputs(
  scenario: ScenarioSummary,
  form: RunSwarmChatSettings["form"],
  workspaceRoot: string,
  projectContextFile: string,
): ScenarioInputKey[] {
  const promptValue = form.prompt.trim();
  const missing: ScenarioInputKey[] = [];
  for (const spec of scenario.inputs) {
    if (!spec.required) continue;
    if (spec.key === "prompt" && !promptValue) missing.push(spec.key);
    else if (spec.key === "workspace_root" && !workspaceRoot) missing.push(spec.key);
    else if (spec.key === "project_context_file" && !projectContextFile)
      missing.push(spec.key);
  }
  return missing;
}

function normalizeForm(form: RunSwarmChatSettings["form"]): NormalizedForm {
  return {
    workspaceRoot: form.workspace_root.trim(),
    projectContextFile: form.project_context_file.trim(),
    scenarioId: (form.scenario_id ?? "").trim(),
  };
}

function buildPipelineSelection(
  pipelineState: RunSwarmChatSettings["pipelineState"],
): PipelineSelection {
  const collectedSteps = pipelineState.collectStepIds();
  const stepIds = collectedSteps.includes(CLARIFY_INPUT_STEP_ID)
    ? collectedSteps
    : [CLARIFY_INPUT_STEP_ID, ...collectedSteps];
  const stages = pipelineState.collectStages();
  const hasParallelStages = stages.some((stage) => stage.length > 1);
  return { stepIds, stages, hasParallelStages };
}

function ensurePipelineStepsPresent(
  selection: PipelineSelection,
  translate: Translator,
): boolean {
  if (selection.stepIds.length === 0) {
    agentConfigErrorMessage.value = translate("errors.addPipelineStep");
    return false;
  }
  return true;
}

function ensurePipelineRolesHaveModels(
  selection: PipelineSelection,
  settings: RunSwarmChatSettings,
  translate: Translator,
): boolean {
  const missing: string[] = [];
  const seen = new Set<string>();
  for (const stepId of selection.stepIds) {
    const role = roleRefForStep(stepId);
    if (!role || seen.has(role)) continue;
    seen.add(role);
    const cfg = settings.rolesState.collectRoleApiConfig(role);
    const model = String(cfg.model ?? "").trim();
    const profile = String(cfg.remote_profile ?? "").trim();
    if (!model && !profile) missing.push(role);
  }
  if (missing.length === 0) return true;
  agentConfigErrorMessage.value = translate("errors.roleMissingModel", {
    roles: missing.join(", "),
  });
  return false;
}

async function confirmStepOrderOrCancel(
  selection: PipelineSelection,
  translate: Translator,
): Promise<boolean> {
  const orderReport = analyzePipelineStepOrder(selection.stepIds);
  if (!orderReport.hasViolations) return true;
  const confirmed = await useUxStore().confirmDialog({
    title: translate("pipelineSteps.orderWarningTitle"),
    message: [
      formatStepOrderSummary(orderReport),
      "",
      translate("pipelineSteps.orderWarningPrompt"),
    ].join("\n"),
  });
  if (!confirmed) {
    agentConfigErrorMessage.value = translate("pipelineSteps.orderWarningCancelled");
    return false;
  }
  return true;
}

const VISUAL_STEP_IDS = new Set(["visual_probe", "e2e"]);

function warnIfVisualStepsWithoutWorkspace(
  selection: PipelineSelection,
  normalized: NormalizedForm,
  handlers: RunSwarmChatHandlers,
): void {
  if (!handlers.onWarning) return;
  const hasVisualStep = selection.stepIds.some((id) => VISUAL_STEP_IDS.has(id));
  if (!hasVisualStep) return;
  if (normalized.workspaceRoot.trim()) return;
  handlers.onWarning(
    "This run includes visual_probe/e2e, but no workspace path is set — " +
      "those steps will be skipped. Set the project's Workspace root to capture " +
      "real browser screenshots.",
  );
}

function warnIfImageAttachmentsWithoutPmStep(
  form: RunSwarmChatSettings["form"],
  selection: PipelineSelection,
  handlers: RunSwarmChatHandlers,
): void {
  if (!handlers.onWarning) return;
  const imageAttachments = form.image_attachments ?? [];
  if (!imageAttachments.length) return;
  if (selection.stepIds.includes("pm")) return;
  handlers.onWarning(
    "This run has image attachments, but its pipeline has no 'pm' step — " +
      "only the pm step pre-processes images via vision tools, so the " +
      "screenshots will be ignored. Add the pm step or describe the image " +
      "contents in text.",
  );
}

function selectionFromScenario(scenario: ScenarioSummary): PipelineSelection {
  const steps = scenario.pipeline_steps ?? [];
  const stepIds = steps.includes(CLARIFY_INPUT_STEP_ID)
    ? [...steps]
    : [CLARIFY_INPUT_STEP_ID, ...steps];
  return { stepIds, stages: [], hasParallelStages: false };
}

function ensureScenarioInputsPresent(
  scenario: ScenarioSummary,
  form: RunSwarmChatSettings["form"],
  workspaceRoot: string,
  projectContextFile: string,
  translate: Translator,
): boolean {
  const missing = findMissingRequiredScenarioInputs(
    scenario,
    form,
    workspaceRoot,
    projectContextFile,
  );
  if (missing.length === 0) return true;
  agentConfigErrorMessage.value = translate("scenarios.preflight.missingInputs", {
    scenario: scenario.id,
    fields: missing.join(", "),
  });
  return false;
}

function buildSwarmChatPayload(
  form: RunSwarmChatSettings["form"],
  agentConfig: ReturnType<typeof buildAgentConfig>,
  selection: PipelineSelection,
  normalized: NormalizedForm,
): Parameters<typeof startSwarmChatStream>[0] {
  const overridesMap = form.scenario_overrides ?? {};
  const overrideForActive = normalized.scenarioId
    ? overridesMap[normalized.scenarioId]
    : undefined;
  const scenarioOverrides =
    normalized.scenarioId && overrideForActive
      ? { [normalized.scenarioId]: overrideForActive }
      : null;
  const attachments = Array.isArray(form.attachments)
    ? form.attachments
        .filter((att) => att?.name?.trim() && att?.content)
        .map((att) => ({ name: att.name.trim(), content: att.content }))
    : [];
  const imageAttachments = Array.isArray(form.image_attachments)
    ? form.image_attachments
        .filter((att) => att?.name?.trim() && att?.path?.trim())
        .map((att) => ({ name: att.name.trim(), path: att.path.trim() }))
    : [];
  return {
    model: SWARM_CHAT_MODEL_ID,
    stream: true,
    messages: [{ role: "user", content: form.prompt }],
    agent_config: agentConfig,
    pipeline_steps: selection.stepIds,
    ...(selection.hasParallelStages ? { pipeline_stages: selection.stages } : {}),
    ...(normalized.scenarioId ? { scenario_id: normalized.scenarioId } : {}),
    ...(scenarioOverrides ? { scenario_overrides: scenarioOverrides } : {}),
    workspace_root: normalized.workspaceRoot || null,
    project_context_file: normalized.projectContextFile || null,
    workspace_write: form.workspace_write,
    ...(attachments.length ? { attachments } : {}),
    ...(imageAttachments.length ? { image_attachments: imageAttachments } : {}),
  };
}

async function readHttpErrorMessage(response: Response): Promise<string> {
  const fallbackStatus = `HTTP ${response.status}`;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return fallbackStatus;
  const body = (await response.json()) as { detail?: unknown; error?: unknown };
  if (typeof body?.detail === "string") return body.detail;
  if (typeof body?.error === "string") return body.error;
  return fallbackStatus;
}

export async function runSwarmChat(
  settings: RunSwarmChatSettings,
  handlers: RunSwarmChatHandlers,
  options?: RunSwarmChatOptions,
): Promise<void> {
  const { t: translate } = useI18n();
  const { form, pipelineState } = settings;
  const agentConfig = buildAgentConfig(settings);
  if (!agentConfig) return;

  const normalized = normalizeForm(form);

  // A selected scenario owns the pipeline steps; the per-project pipeline
  // editor is only used when no scenario is active (custom run).
  let selection: PipelineSelection;
  let payloadNormalized = normalized;
  if (normalized.scenarioId) {
    const resolve = options?.resolveScenario ?? fetchScenarioById;
    const resolved = await resolve(normalized.scenarioId);
    if (!resolved) {
      agentConfigErrorMessage.value = translate(
        "scenarios.preflight.scenarioNotFound",
        { scenario: normalized.scenarioId },
      );
      return;
    }
    if (
      !ensureScenarioInputsPresent(
        resolved.scenario,
        form,
        normalized.workspaceRoot,
        normalized.projectContextFile,
        translate,
      )
    ) {
      return;
    }
    selection = selectionFromScenario(resolved.scenario);
    // Custom scenarios are client-only; the backend rejects their id. Run them
    // as an explicit pipeline (steps only, no scenario_id).
    if (resolved.isCustom) {
      payloadNormalized = { ...normalized, scenarioId: "" };
    }
  } else {
    selection = buildPipelineSelection(pipelineState);
  }

  if (!ensurePipelineStepsPresent(selection, translate)) return;
  if (!ensurePipelineRolesHaveModels(selection, settings, translate)) return;
  if (!(await confirmStepOrderOrCancel(selection, translate))) return;

  warnIfVisualStepsWithoutWorkspace(selection, normalized, handlers);
  warnIfImageAttachmentsWithoutPmStep(form, selection, handlers);

  const payload = buildSwarmChatPayload(
    form,
    agentConfig,
    selection,
    payloadNormalized,
  );
  const response = await startSwarmChatStream(payload);
  if (!response.ok) {
    // The backend records a recoverable artifact even for early (pre-stream)
    // failures and returns its id in X-Task-Id. Register the failed run so it
    // stays visible in history and the user can open its recovered logs.
    const failedTaskId = response.headers.get(TASK_ID_HEADER) ?? "";
    if (failedTaskId) handlers.onTaskId(failedTaskId, selection.stepIds);
    throw new Error(await readHttpErrorMessage(response));
  }

  const taskId = response.headers.get(TASK_ID_HEADER) ?? "";
  handlers.onTaskId(taskId, selection.stepIds);
  handlers.sendWsSubscribe();

  const reader = response.body?.getReader();
  if (reader && handlers.onEvent) {
    await consumeSseStream(reader, handlers.onEvent, options?.signal);
  }
  handlers.onDone();
}
