import {
  parseSpecLintReportPayload,
  type SpecLintReport,
} from "@/shared/model/spec-lint-types";
import { ApiError, httpPost } from "@/shared/api/http";

export interface LintSpecInput {
  scenario: string;
  specText: string;
}

export async function lintSpec(input: LintSpecInput): Promise<SpecLintReport> {
  const body = {
    scenario: input.scenario,
    spec_text: input.specText,
  };
  const raw = await httpPost<Record<string, unknown>>(
    "/v1/orchestration/spec-lint",
    body,
  );
  const parsed = parseSpecLintReportPayload(raw);
  if (!parsed) {
    throw new ApiError(
      "spec-lint returned a malformed payload",
      200,
      JSON.stringify(raw),
    );
  }
  return parsed;
}
