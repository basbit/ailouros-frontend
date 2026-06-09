import {
  parseSkillDispatchPayload,
  type SkillDispatchDecision,
} from "@/shared/model/skill-dispatch-types";
import { ApiError, httpPost } from "@/shared/api/http";

export interface DispatchSkillInput {
  scenario: string;
  phase: string;
  userInput: string;
}

export async function dispatchSkill(
  input: DispatchSkillInput,
): Promise<SkillDispatchDecision> {
  const body = {
    scenario: input.scenario,
    phase: input.phase,
    user_input: input.userInput,
  };
  const raw = await httpPost<Record<string, unknown>>(
    "/v1/orchestration/skill-dispatch",
    body,
  );
  const parsed = parseSkillDispatchPayload(raw);
  if (!parsed) {
    throw new ApiError(
      "skill-dispatch returned a malformed payload",
      200,
      JSON.stringify(raw),
    );
  }
  return parsed;
}
