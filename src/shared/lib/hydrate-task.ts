import { apiUrl } from "@/shared/api/base";
import { ApiError } from "@/shared/api/http";
import { getLegacyTaskSnapshot } from "@/shared/api/endpoints/tasks";

type TaskHistoryRow = { agent?: string; message?: string; timestamp?: string };

export interface HydrateResult {
  taskId: string;
  history: TaskHistoryRow[];
  status: string | null;
  error: unknown;
  agents: string[];
  artifactPath: string | null;
  scenarioId: string | null;
  scenarioTitle: string | null;
  scenarioCategory: string | null;
}

export type TaskResolution =
  | { outcome: "found"; task: HydrateResult }
  | { outcome: "unknown" }
  | { outcome: "error"; message: string };

export async function resolveTaskFromServer(
  taskIdInput: string,
): Promise<TaskResolution> {
  const taskId = taskIdInput.trim();
  if (!taskId) return { outcome: "unknown" };

  try {
    const snapshot = await getLegacyTaskSnapshot(taskId);
    return {
      outcome: "found",
      task: {
        taskId,
        history: snapshot.history ?? [],
        status: typeof snapshot.status === "string" ? snapshot.status : null,
        error: snapshot.error ?? null,
        agents: snapshot.agents ?? [],
        artifactPath: apiUrl(
          "/artifacts/" + encodeURIComponent(taskId) + "/pipeline.json",
        ),
        scenarioId: snapshot.scenario_id ?? null,
        scenarioTitle: snapshot.scenario_title ?? null,
        scenarioCategory: snapshot.scenario_category ?? null,
      },
    };
  } catch (lookupFailure: unknown) {
    if (lookupFailure instanceof ApiError && lookupFailure.status === 404) {
      return { outcome: "unknown" };
    }
    return {
      outcome: "error",
      message:
        lookupFailure instanceof Error ? lookupFailure.message : String(lookupFailure),
    };
  }
}
