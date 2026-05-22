import { fetchJson } from "@/shared/api/client";

export interface PromptChoice {
  path: string;
  title: string;
  source: "overrides" | "upstream";
}

export interface PromptBody {
  path: string;
  source: "overrides" | "upstream";
  body: string;
}

export interface SkillChoice {
  id: string;
  title: string;
  path: string;
}

export async function listPrompts(): Promise<PromptChoice[]> {
  const res = await fetchJson<{ prompts?: PromptChoice[] }>(`/v1/prompts/list`);
  return Array.isArray(res?.prompts) ? res.prompts : [];
}

export async function getPromptBody(path: string): Promise<PromptBody> {
  return fetchJson<PromptBody>(`/v1/prompts/get?path=${encodeURIComponent(path)}`);
}

export async function savePromptOverride(path: string, body: string): Promise<void> {
  await fetchJson<{ path: string; source: string; bytes: number }>(`/v1/prompts/save`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, body }),
  });
}

export async function listSkills(workspaceRoot: string): Promise<SkillChoice[]> {
  const res = await fetchJson<{ skills?: SkillChoice[] }>(
    `/v1/skills/list?workspace_root=${encodeURIComponent(workspaceRoot)}`,
  );
  return Array.isArray(res?.skills) ? res.skills : [];
}
