import type { UserSettingsDto } from "@/shared/api/endpoints/user-settings";
import type { GlobalSearchKeysState, StateKey } from "./types";
import { DEFAULTS } from "./defaults";

export function buildSyncPayload(
  state: GlobalSearchKeysState,
): Partial<UserSettingsDto> {
  const payload: Record<string, unknown> = {};
  for (const key of Object.keys(DEFAULTS) as StateKey[]) {
    payload[key] = state[key];
  }
  return payload as Partial<UserSettingsDto>;
}
