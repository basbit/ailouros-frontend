import { onMounted } from "vue";
import type { Ref } from "vue";
import { useGlobalSettings } from "@/features/global-settings/useGlobalSettings";
import { useWorkspaceFeatureFlagOverrides } from "@/features/global-settings/useWorkspaceFeatureFlagOverrides";
import type {
  FeatureFlagBooleanKey,
  FeatureFlagStringKey,
} from "@/features/global-settings/featureFlagGroups";

export type BooleanFlagField = { kind: "boolean"; field: FeatureFlagBooleanKey };
export type StringFlagField = {
  kind: "string" | "enum";
  field: FeatureFlagStringKey;
};

export function useFeatureFlagFields(workspaceRootRef: Ref<string>) {
  const { state, setKey } = useGlobalSettings();
  const workspaceOverrides = useWorkspaceFeatureFlagOverrides(workspaceRootRef);

  onMounted(() => {
    void workspaceOverrides.loadForCurrentWorkspace();
  });

  function readBooleanFieldValue(field: BooleanFlagField): boolean {
    if (workspaceOverrides.isOverridden(field.field)) {
      return Boolean(workspaceOverrides.overrideValue(field.field));
    }
    return state[field.field] as boolean;
  }

  function readStringFieldValue(field: StringFlagField): string {
    if (workspaceOverrides.isOverridden(field.field)) {
      return String(workspaceOverrides.overrideValue(field.field) ?? "");
    }
    return state[field.field] as string;
  }

  async function writeBooleanFieldValue(
    field: BooleanFlagField,
    value: boolean,
  ): Promise<void> {
    if (workspaceOverrides.isOverridden(field.field)) {
      await workspaceOverrides.setOverride(field.field, value);
      return;
    }
    setKey(field.field, value);
  }

  async function writeStringFieldValue(
    field: StringFlagField,
    value: string,
  ): Promise<void> {
    if (workspaceOverrides.isOverridden(field.field)) {
      await workspaceOverrides.setOverride(field.field, value);
      return;
    }
    setKey(field.field, value);
  }

  async function toggleOverride(
    field: BooleanFlagField | StringFlagField,
    enabled: boolean,
  ): Promise<void> {
    if (!enabled) {
      await workspaceOverrides.removeOverride(field.field);
      return;
    }
    const initialValue =
      field.kind === "boolean"
        ? (state[field.field] as boolean)
        : (state[field.field] as string);
    await workspaceOverrides.setOverride(field.field, initialValue);
  }

  return {
    workspaceOverrides,
    readBooleanFieldValue,
    readStringFieldValue,
    writeBooleanFieldValue,
    writeStringFieldValue,
    toggleOverride,
  };
}
