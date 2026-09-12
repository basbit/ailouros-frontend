import { httpGet, httpPost } from "@/shared/api/http";
import type { Playbook, RunPlaybookRequest, RunPlaybookResponse } from "../model/types";

export async function fetchPlaybooks(): Promise<Playbook[]> {
  return httpGet<Playbook[]>("/v1/playbooks");
}

export async function fetchPlaybook(playbookId: string): Promise<Playbook> {
  return httpGet<Playbook>(`/v1/playbooks/${encodeURIComponent(playbookId)}`);
}

export async function runPlaybook(
  playbookId: string,
  payload: RunPlaybookRequest,
): Promise<RunPlaybookResponse> {
  return httpPost<RunPlaybookResponse>(
    `/v1/playbooks/${encodeURIComponent(playbookId)}/run`,
    payload,
  );
}
