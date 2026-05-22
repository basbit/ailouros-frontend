import { apiUrl } from "@/shared/api/base";
import { httpRequestRaw } from "@/shared/api/http";
import { getLegacyTaskSnapshot } from "@/shared/api/endpoints/tasks";

type TaskHistoryRow = { agent?: string; message?: string; timestamp?: string };

export interface HydrateResult {
  taskId: string;
  history: TaskHistoryRow[];
  status: string | null;
  error: unknown;
  agents: string[];
  artifactPath: string | null;
  fromLogFallback: boolean;
  scenarioId: string | null;
  scenarioTitle: string | null;
  scenarioCategory: string | null;
}

export async function hydrateTaskFromServer(
  taskIdInput: string,
): Promise<HydrateResult | null> {
  const taskId = taskIdInput.trim();
  if (!taskId) return null;

  const artifactJson = apiUrl(
    "/artifacts/" + encodeURIComponent(taskId) + "/pipeline.json",
  );

  try {
    const snapshot = await getLegacyTaskSnapshot(taskId);
    const history = snapshot.history ?? [];
    const agents = snapshot.agents ?? [];
    return {
      taskId: taskId,
      history,
      status: typeof snapshot.status === "string" ? snapshot.status : null,
      error: snapshot.error ?? null,
      agents,
      artifactPath: artifactJson,
      fromLogFallback: false,
      scenarioId: snapshot.scenario_id ?? null,
      scenarioTitle: snapshot.scenario_title ?? null,
      scenarioCategory: snapshot.scenario_category ?? null,
    };
  } catch {
    /* Network / CORS */
  }

  try {
    const lr = await httpRequestRaw(
      "GET",
      "/artifacts/" + encodeURIComponent(taskId) + "/pipeline_run.log",
    );
    const text = await lr.text();
    const body = text.trim() || "(empty pipeline_run.log)";
    return {
      taskId: taskId,
      history: [
        {
          agent: "pipeline_run.log",
          message: body,
          timestamp: new Date().toISOString(),
        },
      ],
      status: "completed",
      error: null,
      agents: [],
      artifactPath: artifactJson,
      fromLogFallback: true,
      scenarioId: null,
      scenarioTitle: null,
      scenarioCategory: null,
    };
  } catch {
    /* ignore */
  }

  return null;
}
