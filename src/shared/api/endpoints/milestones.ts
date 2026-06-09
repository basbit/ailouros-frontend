import { parseMilestonePayload, type Milestone } from "@/shared/model/milestone-types";
import { httpGet } from "@/shared/api/http";

export async function listMilestones(workspaceRoot: string): Promise<Milestone[]> {
  const params = new URLSearchParams({ workspace_root: workspaceRoot });
  const raw = await httpGet<{ items?: unknown }>(`/v1/milestones?${params.toString()}`);
  if (!Array.isArray(raw.items)) return [];
  return raw.items
    .map(parseMilestonePayload)
    .filter((entry): entry is Milestone => entry !== null);
}
