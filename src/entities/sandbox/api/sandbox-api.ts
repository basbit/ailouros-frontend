import { httpGet, httpPost } from "@/shared/api/http";
import type {
  SandboxProfile,
  SandboxRunCommandPayload,
  SandboxRunCommandResult,
  SandboxStatus,
} from "../model/types";

export async function getSandboxProfiles(): Promise<SandboxProfile[]> {
  return httpGet<SandboxProfile[]>("/v1/workspace/sandbox/profiles");
}

export async function getSandboxStatus(): Promise<SandboxStatus> {
  return httpGet<SandboxStatus>("/v1/workspace/sandbox/status");
}

export async function runSandboxCommand(
  payload: SandboxRunCommandPayload,
): Promise<SandboxRunCommandResult> {
  return httpPost<SandboxRunCommandResult>("/v1/workspace/sandbox/run", payload);
}
