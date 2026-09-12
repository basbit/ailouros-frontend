import { httpGet, httpPut } from "@/shared/api/http";
// The leaf `global-search/types`, not the `global-search-keys` barrel: the
// barrel re-exports the global-search store, which calls back into this module,
// so importing it here closed a type-only import cycle.
import type { GlobalSearchKeysState } from "@/shared/lib/global-search/types";
import type { paths } from "@/shared/api/openapi-types";

export type UserSettingsDto = GlobalSearchKeysState;

/**
 * `PUT /v1/user/settings` answers `{status, updated}` — not the `{ok, saved}`
 * this module used to claim. The generated type is the backend's word for it.
 */
type UserSettingsUpdateResponse =
  paths["/v1/user/settings"]["put"]["responses"][200]["content"]["application/json"];

export async function getUserSettings(): Promise<Partial<UserSettingsDto>> {
  return httpGet<Partial<UserSettingsDto>>("/v1/user/settings");
}

export async function putUserSettings(
  payload: Partial<UserSettingsDto>,
): Promise<void> {
  await httpPut<UserSettingsUpdateResponse>("/v1/user/settings", payload);
}
