import { startSwarmChatStream } from "@/shared/api/endpoints/onboarding";
import { listScenarios } from "@/shared/api/endpoints/scenarios";
import {
  agentConfigErrorMessage,
  buildAgentConfig,
  type RunSwarmChatSettings,
} from "@/shared/lib/agent-config";
import { type ChatStreamEvent } from "@/shared/lib/chat-stream-events";
import { useI18n } from "@/shared/lib/i18n";
import {
  analyzePipelineStepOrder,
  formatStepOrderSummary,
} from "@/shared/lib/step-order";
import { consumeSseStream } from "@/shared/lib/swarm-chat-stream";
import type { ScenarioInputKey, ScenarioSummary } from "@/shared/model/scenario-types";

const CLARIFY_INPUT_STEP_ID = "clarify_input";
const SWARM_CHAT_MODEL_ID = "swarm-local";
const TASK_ID_HEADER = "x-task-id";

type Translator = ReturnType<typeof useI18n>["t"];

export interface RunSwarmChatOptions {
  signal?: AbortSignal;
}

interface RunSwarmChatHandlers {
  onTaskId: (taskId: string) => void;
  onDone: () => void;
  sendWsSubscribe: () => void;
  onEvent?: (event: ChatStreamEvent) => void;
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

async function fetchScenarioById(scenarioId: string): Promise<ScenarioSummary | null> {
  const list = await listScenarios();
  return list.scenarios.find((entry) => entry.id === scenarioId) ?? null;
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

function confirmStepOrderOrCancel(
  selection: PipelineSelection,
  translate: Translator,
): boolean {
  const orderReport = analyzePipelineStepOrder(selection.stepIds);
  if (!orderReport.hasViolations) return true;
  const message = [
    translate("pipelineSteps.orderWarningTitle"),
    "",
    formatStepOrderSummary(orderReport),
    "",
    translate("pipelineSteps.orderWarningPrompt"),
  ].join("\n");
  const confirmed = window.confirm(message);
  if (!confirmed) {
    agentConfigErrorMessage.value = translate("pipelineSteps.orderWarningCancelled");
    return false;
  }
  return true;
}

async function ensureScenarioInputsPresent(
  scenarioId: string,
  form: RunSwarmChatSettings["form"],
  workspaceRoot: string,
  projectContextFile: string,
  translate: Translator,
): Promise<boolean> {
  if (!scenarioId) return true;
  const scenario = await fetchScenarioById(scenarioId);
  if (!scenario) return true;
  const missing = findMissingRequiredScenarioInputs(
    scenario,
    form,
    workspaceRoot,
    projectContextFile,
  );
  if (missing.length === 0) return true;
  agentConfigErrorMessage.value = translate("scenarios.preflight.missingInputs", {
    scenario: scenarioId,
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

  const selection = buildPipelineSelection(pipelineState);
  if (!ensurePipelineStepsPresent(selection, translate)) return;
  if (!confirmStepOrderOrCancel(selection, translate)) return;

  const normalized = normalizeForm(form);
  const scenarioInputsValid = await ensureScenarioInputsPresent(
    normalized.scenarioId,
    form,
    normalized.workspaceRoot,
    normalized.projectContextFile,
    translate,
  );
  if (!scenarioInputsValid) return;

  const payload = buildSwarmChatPayload(form, agentConfig, selection, normalized);
  const response = await startSwarmChatStream(payload);
  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response));
  }

  const taskId = response.headers.get(TASK_ID_HEADER) ?? "";
  handlers.onTaskId(taskId);
  handlers.sendWsSubscribe();

  const reader = response.body?.getReader();
  if (reader && handlers.onEvent) {
    await consumeSseStream(reader, handlers.onEvent, options?.signal);
  }
  handlers.onDone();
}
