import { startSwarmChatStream } from "@/shared/api/endpoints/onboarding";
import { listScenarios } from "@/shared/api/endpoints/scenarios";
import {
  agentConfigErrorMessage,
  buildAgentConfig,
  type RunSwarmChatSettings,
} from "@/shared/lib/agent-config";
import {
  parseChatStreamEvent,
  type ChatStreamEvent,
  type OrchestratorStreamEvent,
} from "@/shared/lib/chat-stream-events";
import {
  TOPOLOGY_PRESETS,
  deriveStagesForTopology,
} from "@/shared/lib/pipeline-topology";
import { useI18n } from "@/shared/lib/i18n";
import {
  analyzePipelineStepOrder,
  formatStepOrderSummary,
} from "@/shared/lib/step-order";
import type { ScenarioInputKey, ScenarioSummary } from "@/shared/model/scenario-types";

export type { ChatStreamEvent, OrchestratorStreamEvent };

async function collectMissingRequiredInputs(
  scenarioId: string,
  prompt: string,
  workspaceRoot: string,
  projectContextFile: string,
): Promise<ScenarioInputKey[]> {
  let scenario: ScenarioSummary | undefined;
  try {
    const list = await listScenarios();
    scenario = list.scenarios.find((entry) => entry.id === scenarioId);
  } catch {
    return [];
  }
  if (!scenario) return [];
  const missing: ScenarioInputKey[] = [];
  for (const spec of scenario.inputs) {
    if (!spec.required) continue;
    if (spec.key === "prompt" && !prompt.trim()) {
      missing.push(spec.key);
    } else if (spec.key === "workspace_root" && !workspaceRoot) {
      missing.push(spec.key);
    } else if (spec.key === "project_context_file" && !projectContextFile) {
      missing.push(spec.key);
    }
  }
  return missing;
}

export async function runSwarmChat(
  settings: RunSwarmChatSettings,
  onTaskId: (taskId: string) => void,
  onDone: () => void,
  sendWsSubscribe: () => void,
  onEvent?: (event: ChatStreamEvent) => void,
): Promise<void> {
  const { t } = useI18n();
  const { form, pipelineState } = settings;
  const agentConfig = buildAgentConfig(settings);
  if (!agentConfig) return;

  const pipelineSteps = pipelineState.collectStepIds();
  if (!pipelineSteps.length) {
    agentConfigErrorMessage.value = t("errors.addPipelineStep");
    return;
  }
  if (!pipelineSteps.includes("clarify_input")) {
    pipelineSteps.unshift("clarify_input");
  }

  const orderReport = analyzePipelineStepOrder(pipelineSteps);
  if (orderReport.hasViolations) {
    const confirmed = window.confirm(
      `${t("pipelineSteps.orderWarningTitle")}\n\n${formatStepOrderSummary(orderReport)}\n\n${t(
        "pipelineSteps.orderWarningPrompt",
      )}`,
    );
    if (!confirmed) {
      agentConfigErrorMessage.value = t("pipelineSteps.orderWarningCancelled");
      return;
    }
  }

  const topology = form.swarm_topology.trim();
  const manualStages = pipelineState.collectStages();
  const hasManualParallelStages = manualStages.some((stage) => stage.length > 1);
  let pipelineStages: string[][] = manualStages;
  if (!hasManualParallelStages && topology && topology in TOPOLOGY_PRESETS) {
    pipelineStages = deriveStagesForTopology(pipelineSteps, topology);
  }
  const hasParallelStages = pipelineStages.some((stage) => stage.length > 1);

  const workspaceRoot = form.workspace_root.trim();
  const projectContextFile = form.project_context_file.trim();
  const scenarioId = (form.scenario_id ?? "").trim();

  if (scenarioId) {
    const missing = await collectMissingRequiredInputs(
      scenarioId,
      form.prompt,
      workspaceRoot,
      projectContextFile,
    );
    if (missing.length > 0) {
      agentConfigErrorMessage.value = t("scenarios.preflight.missingInputs", {
        scenario: scenarioId,
        fields: missing.join(", "),
      });
      return;
    }
  }
  const scenarioOverridesMap = form.scenario_overrides ?? {};
  const overrideForActive = scenarioId ? scenarioOverridesMap[scenarioId] : undefined;
  const sendOverrides =
    scenarioId && overrideForActive ? { [scenarioId]: overrideForActive } : null;

  const resp = await startSwarmChatStream({
    model: "swarm-local",
    stream: true,
    messages: [{ role: "user", content: form.prompt }],
    agent_config: agentConfig,
    pipeline_steps: pipelineSteps,
    ...(hasParallelStages ? { pipeline_stages: pipelineStages } : {}),
    ...(scenarioId ? { scenario_id: scenarioId } : {}),
    ...(sendOverrides ? { scenario_overrides: sendOverrides } : {}),
    workspace_root: workspaceRoot || null,
    project_context_file: projectContextFile || null,
    workspace_write: form.workspace_write,
  });

  if (!resp.ok) {
    let errMsg = `HTTP ${resp.status}`;
    try {
      const body = await resp.json();
      errMsg = body?.detail ?? body?.error ?? errMsg;
    } catch {
      // response body is not JSON — use status text
    }
    throw new Error(errMsg);
  }

  const taskId = resp.headers.get("x-task-id") ?? "";
  onTaskId(taskId);
  sendWsSubscribe();

  const reader = resp.body?.getReader();
  if (reader) {
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!onEvent || !value) continue;
      buffer += decoder.decode(value, { stream: true });
      let sep = buffer.indexOf("\n\n");
      while (sep !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const chunk = JSON.parse(payload) as {
              choices?: { delta?: { content?: string } }[];
            };
            const content = chunk.choices?.[0]?.delta?.content ?? "";
            if (!content) continue;
            const evt = parseChatStreamEvent(content);
            if (evt) onEvent(evt);
          } catch {
            // Non-JSON data line — ignore silently.
          }
        }
        sep = buffer.indexOf("\n\n");
      }
    }
  }
  onDone();
}
