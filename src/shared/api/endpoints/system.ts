import { fetchJson } from "@/shared/api/client";

export interface UpdateStatusDto {
  checked: boolean;
  unknown: boolean;
  behind: number;
  ahead: number;
  current_ref: string;
  remote_ref: string;
  branch: string;
  reason?: string;
}

export async function getUpdateAvailable(): Promise<UpdateStatusDto> {
  return fetchJson<UpdateStatusDto>("/v1/system/update-available");
}
