import { inject, type InjectionKey } from "vue";
import type { ProjectFormActions } from "./useProjectFormActions";

export const PROJECT_FORM_ACTIONS_KEY: InjectionKey<ProjectFormActions> =
  Symbol("projectFormActions");

export function useInjectedProjectFormActions(): ProjectFormActions {
  const value = inject(PROJECT_FORM_ACTIONS_KEY);
  if (!value) {
    throw new Error("PROJECT_FORM_ACTIONS_KEY was not provided by the app bootstrap");
  }
  return value;
}
