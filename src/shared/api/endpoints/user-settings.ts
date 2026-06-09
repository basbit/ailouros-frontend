import { httpGet, httpPut } from "@/shared/api/http";
import type { GlobalSearchKeysState } from "@/shared/lib/global-search-keys";

export type UserSettingsDto = GlobalSearchKeysState;

export async function getUserSettings(): Promise<Partial<UserSettingsDto>> {
  return httpGet<Partial<UserSettingsDto>>("/v1/user/settings");
}

export async function putUserSettings(
  payload: Partial<UserSettingsDto>,
): Promise<void> {
  await httpPut<{ ok: boolean; saved: string[] }>("/v1/user/settings", payload);
}
