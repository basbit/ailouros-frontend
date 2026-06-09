import { reactive, watch, type Ref } from "vue";
import {
  getWorkspaceFeatureFlagOverrides,
  saveWorkspaceFeatureFlagOverrides,
  type WorkspaceFeatureFlagOverrides,
} from "@/shared/api/endpoints/workspace-feature-flag-overrides";
import { frontendLogger } from "@/shared/lib/frontend-logger";

interface WorkspaceOverridesState {
  workspaceRoot: string;
  overrides: WorkspaceFeatureFlagOverrides;
  loaded: boolean;
  saving: boolean;
}

export function useWorkspaceFeatureFlagOverrides(workspaceRoot: Ref<string>) {
  const state = reactive<WorkspaceOverridesState>({
    workspaceRoot: "",
    overrides: {},
    loaded: false,
    saving: false,
  });

  async function loadForCurrentWorkspace(): Promise<void> {
    const trimmedRoot = (workspaceRoot.value ?? "").trim();
    if (!trimmedRoot) {
      state.workspaceRoot = "";
      state.overrides = {};
      state.loaded = false;
      return;
    }
    const fetched = await getWorkspaceFeatureFlagOverrides(trimmedRoot);
    state.workspaceRoot = trimmedRoot;
    state.overrides = fetched;
    state.loaded = true;
  }

  watch(workspaceRoot, () => {
    void loadForCurrentWorkspace().catch((error) => {
      frontendLogger.warn("workspace feature flag overrides load failed", error);
    });
  });

  async function persist(): Promise<void> {
    if (!state.workspaceRoot) return;
    state.saving = true;
    try {
      await saveWorkspaceFeatureFlagOverrides(state.workspaceRoot, state.overrides);
    } finally {
      state.saving = false;
    }
  }

  function isOverridden(field: string): boolean {
    return Object.prototype.hasOwnProperty.call(state.overrides, field);
  }

  function overrideValue(field: string): boolean | string | undefined {
    return state.overrides[field];
  }

  async function setOverride(field: string, value: boolean | string): Promise<void> {
    state.overrides = { ...state.overrides, [field]: value };
    await persist().catch((error) => {
      frontendLogger.warn("workspace feature flag override save failed", error);
    });
  }

  async function removeOverride(field: string): Promise<void> {
    if (!isOverridden(field)) return;
    const updated = { ...state.overrides };
    delete updated[field];
    state.overrides = updated;
    await persist().catch((error) => {
      frontendLogger.warn("workspace feature flag override save failed", error);
    });
  }

  return {
    state,
    isOverridden,
    overrideValue,
    setOverride,
    removeOverride,
    loadForCurrentWorkspace,
  };
}
