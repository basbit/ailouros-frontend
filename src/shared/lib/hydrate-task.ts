/**
 * Hydrate task state for the UI from Redis (/tasks/:id) or, as a fallback,
 * from the on-disk pipeline_run.log artifact.
 */
import { apiUrl } from "@/shared/api/base";

export type TaskHistoryRow = { agent?: string; message?: string; timestamp?: string };

export interface HydrateResult {
  taskId: string;
  history: TaskHistoryRow[];
  status: string | null;
  error: unknown;
  agents: string[];
  artifactPath: string | null;
  /** True when hydration used only the artifact log because Redis no longer has the task. */
  fromLogFallback: boolean;
}

export async function hydrateTaskFromServer(
  taskId: string,
): Promise<HydrateResult | null> {
  const tid = taskId.trim();
  if (!tid) return null;

  const artifactJson = apiUrl(
    "/artifacts/" + encodeURIComponent(tid) + "/pipeline.json",
  );

  try {
    const r = await fetch(apiUrl("/tasks/" + encodeURIComponent(tid)));
    if (r.ok) {
      const j = (await r.json()) as Record<string, unknown>;
      const history = (j.history as TaskHistoryRow[] | undefined) ?? [];
      const agents = (j.agents as string[] | undefined) ?? [];
      return {
        taskId: tid,
        history,
        status: typeof j.status === "string" ? j.status : null,
        error: j.error ?? null,
        agents,
        artifactPath: artifactJson,
        fromLogFallback: false,
      };
    }
  } catch {
    /* Network / CORS */
  }

  try {
    const lr = await fetch(
      apiUrl("/artifacts/" + encodeURIComponent(tid) + "/pipeline_run.log"),
    );
    if (lr.ok) {
      const text = await lr.text();
      const body = text.trim() || "(empty pipeline_run.log)";
      return {
        taskId: tid,
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
      };
    }
  } catch {
    /* ignore */
  }

  return null;
}
