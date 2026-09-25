import type { UserSettingsDto } from "@/shared/api/endpoints/user-settings";
import type { GlobalSearchKeysState, StateKey } from "./types";

/**
 * Only the given (edited) fields: the server applies exactly what a save
 * carries, so a field the user never touched keeps its value, including one
 * that is set only in the server's environment.
 */
export function buildSyncPayload(
  state: GlobalSearchKeysState,
  keys: readonly StateKey[],
): Partial<UserSettingsDto> {
  const payload: Record<string, unknown> = {};
  for (const key of keys) {
    payload[key] = state[key];
  }
  return payload as Partial<UserSettingsDto>;
}
