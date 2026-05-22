import { inject, type InjectionKey } from "vue";

export type AppSettings = ReturnType<
  typeof import("@/app/providers/useSettings").useSettings
>;

export const APP_SETTINGS_KEY: InjectionKey<AppSettings> = Symbol("appSettings");

export function useInjectedAppSettings(): AppSettings {
  const settings = inject(APP_SETTINGS_KEY);
  if (!settings) {
    throw new Error("APP_SETTINGS_KEY was not provided by the app bootstrap");
  }
  return settings;
}
