import { httpGet, httpPost } from "@/shared/api/http";
import type { paths } from "@/shared/api/openapi-types";

export type TelegramIngressStatus =
  paths["/v1/remote-control/telegram-status"]["get"]["responses"][200]["content"]["application/json"];

type RotateResponse =
  paths["/v1/user/settings/action-link-secret/rotate"]["post"]["responses"][200]["content"]["application/json"];

export async function getTelegramIngressStatus(): Promise<TelegramIngressStatus> {
  return httpGet<TelegramIngressStatus>("/v1/remote-control/telegram-status");
}

export async function rotateActionLinkSecret(secret: string): Promise<RotateResponse> {
  return httpPost<RotateResponse>("/v1/user/settings/action-link-secret/rotate", { secret });
}
