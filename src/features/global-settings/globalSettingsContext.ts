import { inject, type InjectionKey } from "vue";
import type { useGlobalSettings } from "./useGlobalSettings";

export type GlobalSettingsApi = ReturnType<typeof useGlobalSettings>;

export const GLOBAL_SETTINGS_KEY: InjectionKey<GlobalSettingsApi> =
  Symbol("globalSettings");

export function useInjectedGlobalSettings(): GlobalSettingsApi {
  const value = inject(GLOBAL_SETTINGS_KEY);
  if (!value) {
    throw new Error("GLOBAL_SETTINGS_KEY was not provided by the app bootstrap");
  }
  return value;
}
