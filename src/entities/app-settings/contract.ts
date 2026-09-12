import { inject, type InjectionKey } from "vue";
import type { ProjectSettingsFormState } from "@/entities/project";

/**
 * What the lower layers need from whatever provides application settings.
 *
 * This used to be `ReturnType<typeof import("@/app/providers/useSettings")>`:
 * the `entities` layer took its public contract from an `app`-layer
 * implementation, so the dependency ran upwards (invisible to a runtime-only
 * dependency check, because it was a type-level import) and every consumer
 * inherited the provider's entire return type instead of the few members it
 * uses. The contract is now written down here — the narrow slice entity- and
 * feature-level code actually calls — and the app provider implements it.
 *
 * Code that legitimately needs the provider's full surface (pages composing
 * the settings screens) takes the wider type from
 * `@/app/providers/settingsContext`, which is above this layer and may know
 * the concrete implementation.
 */
export interface AppSettingsContract {
  /** Editable project settings bound by the UI. */
  readonly form: ProjectSettingsFormState;
  /** Schedule a debounced persist of the current settings. */
  saveSettingsSoon(): void;
  /** Persist immediately and resolve once the write has been issued. */
  flushSaveAsync(): Promise<void>;
  /** Create a project, make it current, and return its id. */
  newProject(name: string): Promise<string>;
  /** Make an existing project current, loading its settings. */
  switchProject(id: string): Promise<void>;
  /** Delete the current project; resolves to the new current id, or null. */
  deleteCurrentProject(): Promise<string | null>;
}

export const APP_SETTINGS_KEY: InjectionKey<AppSettingsContract> =
  Symbol("appSettings");

export function useInjectedAppSettings(): AppSettingsContract {
  const settings = inject(APP_SETTINGS_KEY);
  if (!settings) {
    throw new Error("APP_SETTINGS_KEY was not provided by the app bootstrap");
  }
  return settings;
}
