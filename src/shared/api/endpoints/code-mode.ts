import { httpGet, httpPost } from "@/shared/api/http";

export interface CodeModeStatus {
  enabled: boolean;
  commandExecAllowed: boolean;
  workspaceWriteAllowed: boolean;
  dockerAvailable: boolean;
  languages: string[];
  profiles: Record<string, string>;
  profileIsolating: Record<string, boolean>;
}

export interface CodeModeRunInput {
  language: string;
  program: string;
  stdin?: string;
  workspaceRoot?: string;
  applyWrites?: boolean;
}

export interface CodeModeRunResult {
  language: string;
  profile: string;
  verdict: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationSeconds: number;
  truncated: boolean;
  message: string;
  writtenPaths: string[];
  writeRefusal: string;
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

export async function getCodeModeStatus(): Promise<CodeModeStatus> {
  const raw = await httpGet<Record<string, unknown>>(
    "/v1/workspace/code-mode/status",
  );
  return {
    enabled: Boolean(raw.enabled),
    commandExecAllowed: Boolean(raw.command_exec_allowed),
    workspaceWriteAllowed: Boolean(raw.workspace_write_allowed),
    dockerAvailable: Boolean(raw.docker_available),
    languages: asStringList(raw.languages),
    profiles: (raw.profiles ?? {}) as Record<string, string>,
    profileIsolating: (raw.profile_isolating ?? {}) as Record<string, boolean>,
  };
}

export async function runCodeMode(
  input: CodeModeRunInput,
): Promise<CodeModeRunResult> {
  const raw = await httpPost<Record<string, unknown>>(
    "/v1/workspace/code-mode/run",
    {
      language: input.language,
      program: input.program,
      stdin: input.stdin ?? "",
      workspace_root: input.workspaceRoot ?? "",
      apply_writes: Boolean(input.applyWrites),
    },
  );
  const writes = (raw.workspace_writes ?? null) as Record<
    string,
    unknown
  > | null;
  return {
    language: String(raw.language ?? ""),
    profile: String(raw.profile ?? ""),
    verdict: String(raw.verdict ?? ""),
    exitCode: Number(raw.exit_code ?? -1),
    stdout: String(raw.stdout ?? ""),
    stderr: String(raw.stderr ?? ""),
    durationSeconds: Number(raw.duration_seconds ?? 0),
    truncated: Boolean(raw.truncated),
    message: String(raw.message ?? ""),
    writtenPaths: writes ? asStringList(writes.written) : [],
    writeRefusal: String(raw.write_refusal ?? ""),
  };
}
