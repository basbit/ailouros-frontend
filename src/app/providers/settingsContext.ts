import { inject, type InjectionKey } from "vue";
import {
  APP_SETTINGS_KEY as APP_SETTINGS_CONTRACT_KEY,
  type AppSettingsContract,
} from "@/entities/app-settings/contract";
import type { useSettings } from "./useSettings";

export type { AppSettingsContract };

/**
 * The full provider surface, for the composition root and the pages that build
 * the settings screens out of it. Lower layers take the narrow
 * `AppSettingsContract` instead — see the note there.
 */
export type AppSettings = ReturnType<typeof useSettings>;

// Same symbol, widened for this layer: `useSettings()` is checked against
// `AppSettingsContract` at its definition site, so app-layer code may rely on
// knowing which implementation is behind the key.
export const APP_SETTINGS_KEY = APP_SETTINGS_CONTRACT_KEY as InjectionKey<AppSettings>;

export function useInjectedAppSettings(): AppSettings {
  const settings = inject(APP_SETTINGS_KEY);
  if (!settings) {
    throw new Error("APP_SETTINGS_KEY was not provided by the app bootstrap");
  }
  return settings;
}
