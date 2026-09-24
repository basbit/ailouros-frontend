import { readTypedJson, writeTypedJson } from "@/shared/lib/persistence-adapter";
import { typedGlobalSettings } from "@/shared/lib/storage-keys";
import type { GlobalSearchKeysState, StateKey } from "./types";
import { DEFAULTS, isBoolKey } from "./defaults";

export function loadFromStorage(state: GlobalSearchKeysState): void {
  const parsed = readTypedJson(typedGlobalSettings<Partial<GlobalSearchKeysState>>());
  if (!parsed || typeof parsed !== "object") return;
  for (const key of Object.keys(DEFAULTS) as StateKey[]) {
    const value = parsed[key];
    if (value === undefined) continue;
    if (isBoolKey(key)) {
      (state as Record<StateKey, unknown>)[key] = Boolean(value);
    } else {
      (state as Record<StateKey, unknown>)[key] = String(value);
    }
  }
}

export function saveToStorage(state: GlobalSearchKeysState): void {
  writeTypedJson(typedGlobalSettings<GlobalSearchKeysState>(), state);
}
