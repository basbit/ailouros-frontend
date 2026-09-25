import { httpGet, httpPut } from "@/shared/api/http";

type EnvVariableKind = "boolean" | "integer" | "float" | "string";

export interface EnvVariableDto {
  name: string;
  group: string;
  default: string;
  description: string;
  kind: EnvVariableKind;
  is_secret: boolean;
  value: string;
  is_set: boolean;
  managed_by_ui_field: string;
  /** The running server reads it only at startup. */
  restart_required: boolean;
  /** Changed since the server started; applies after a restart. */
  restart_pending: boolean;
}

export interface EnvOverrideResult {
  status: string;
  updated: string[];
  rejected: string[];
}

export async function fetchEnvCatalog(): Promise<EnvVariableDto[]> {
  const data = await httpGet<{ variables: EnvVariableDto[] }>("/v1/user/env-catalog");
  return data.variables ?? [];
}

export async function saveEnvOverrides(
  values: Record<string, string>,
): Promise<EnvOverrideResult> {
  return httpPut<EnvOverrideResult>("/v1/user/env-catalog", { values });
}
