import { httpGet, httpPut } from "@/shared/api/http";

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
  const res = await httpGet<{ prompts?: PromptChoice[] }>(`/v1/prompts`);
  return Array.isArray(res?.prompts) ? res.prompts : [];
}

export async function getPromptBody(path: string): Promise<PromptBody> {
  return httpGet<PromptBody>(`/v1/prompts/get?path=${encodeURIComponent(path)}`);
}

export async function savePromptOverride(path: string, body: string): Promise<void> {
  await httpPut<{ path: string; source: string; bytes: number }>(`/v1/prompts/save`, {
    path,
    body,
  });
}

export async function listSkills(workspaceRoot: string): Promise<SkillChoice[]> {
  const res = await httpGet<{ skills?: SkillChoice[] }>(
    `/v1/skills?workspace_root=${encodeURIComponent(workspaceRoot)}`,
  );
  return Array.isArray(res?.skills) ? res.skills : [];
}
