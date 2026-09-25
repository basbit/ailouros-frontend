import { ApiError, httpGet, httpPost } from "@/shared/api/http";
import type { components } from "@/shared/api/openapi-types";

export type ResearchSession = components["schemas"]["ResearchSessionResponse"];
export type ResearchIteration = components["schemas"]["ResearchIterationResponse"];
export type CreateResearchSessionRequest =
  components["schemas"]["CreateResearchSessionRequest"];
type ResearchActionResponse = components["schemas"]["ResearchActionResponse"];
export type ResearchSessionList = components["schemas"]["ResearchSessionListResponse"];
export type CorruptResearchSession = components["schemas"]["CorruptResearchSessionResponse"];

const BASE = "/v1/autoresearch/sessions";

function sessionPath(sessionId: string, action = ""): string {
  const suffix = action ? `/${action}` : "";
  return `${BASE}/${encodeURIComponent(sessionId)}${suffix}`;
}

/** The backend answers failed actions with `{ok: false, error}` (or FastAPI's
 * `{detail}` for validation); surface that text instead of "HTTP 400". */
function readableError(error: unknown): Error {
  if (error instanceof ApiError && error.body) {
    try {
      const parsed = JSON.parse(error.body) as { error?: unknown; detail?: unknown };
      if (typeof parsed.error === "string" && parsed.error)
        return new Error(parsed.error);
      if (typeof parsed.detail === "string" && parsed.detail)
        return new Error(parsed.detail);
      if (Array.isArray(parsed.detail)) {
        return new Error(
          parsed.detail
            .map((item: { loc?: unknown[]; msg?: string }) =>
              `${(item.loc ?? []).slice(1).join(".")}: ${item.msg ?? ""}`.trim(),
            )
            .join("; "),
        );
      }
    } catch {
      return error;
    }
  }
  return error instanceof Error ? error : new Error(String(error));
}

async function postAction(path: string, body: unknown = {}): Promise<ResearchSession> {
  let response: ResearchActionResponse;
  try {
    response = await httpPost<ResearchActionResponse>(path, body);
  } catch (error: unknown) {
    throw readableError(error);
  }
  if (!response.ok || !response.session) {
    throw new Error(response.error || "autoresearch action failed");
  }
  return response.session;
}

/** Readable sessions plus, separately, those whose event log cannot be replayed. */
export function listResearchSessions(): Promise<ResearchSessionList> {
  return httpGet<ResearchSessionList>(BASE);
}

export async function getResearchSession(sessionId: string): Promise<ResearchSession> {
  try {
    return await httpGet<ResearchSession>(sessionPath(sessionId));
  } catch (error: unknown) {
    throw readableError(error);
  }
}

export function createResearchSession(
  request: CreateResearchSessionRequest,
): Promise<ResearchSession> {
  return postAction(BASE, request);
}

export function cancelResearchSession(sessionId: string): Promise<ResearchSession> {
  return postAction(sessionPath(sessionId, "cancel"));
}

export function openResearchPullRequest(
  sessionId: string,
  targetBranch = "",
): Promise<ResearchSession> {
  return postAction(sessionPath(sessionId, "pull-request"), {
    target_branch: targetBranch,
  });
}

export function applyResearchSession(sessionId: string): Promise<ResearchSession> {
  return postAction(sessionPath(sessionId, "apply"));
}

export function discardResearchSession(sessionId: string): Promise<ResearchSession> {
  return postAction(sessionPath(sessionId, "discard"));
}

export type ImproveRolePromptPreset =
  components["schemas"]["ImproveRolePromptPresetResponse"];
export type ImproveRolePromptRequest = components["schemas"]["ImproveRolePromptRequest"];

const PROMPT_PRESET_PATH = "/v1/autoresearch/presets/improve-role-prompt";

export async function getImproveRolePromptPreset(): Promise<ImproveRolePromptPreset> {
  try {
    return await httpGet<ImproveRolePromptPreset>(PROMPT_PRESET_PATH);
  } catch (error: unknown) {
    throw readableError(error);
  }
}

export function startImproveRolePrompt(
  request: ImproveRolePromptRequest,
): Promise<ResearchSession> {
  return postAction(PROMPT_PRESET_PATH, request);
}
