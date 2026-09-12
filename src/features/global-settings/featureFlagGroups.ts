import type {
  FeatureFlagEnumField,
  FeatureFlagEnumOption,
  FeatureFlagField,
  FeatureFlagGroup,
} from "./featureFlagFieldTypes";
import { FLAG_GROUP_MCP } from "./flagGroupMcp";
import { FLAG_GROUP_MEMORY } from "./flagGroupMemory";
import { FLAG_GROUP_RETRIEVAL } from "./flagGroupRetrieval";
import { FLAG_GROUP_REASONING } from "./flagGroupReasoning";
import { FLAG_GROUP_EFFICIENCY } from "./flagGroupEfficiency";
import { FLAG_GROUP_EVALUATION } from "./flagGroupEvaluation";
import { FLAG_GROUP_UX } from "./flagGroupUx";
import { FLAG_GROUP_ORCHESTRATION } from "./flagGroupOrchestration";
import { FLAG_GROUP_WORKSPACE } from "./flagGroupWorkspace";

export type {
  FeatureFlagBooleanKey,
  FeatureFlagStringKey,
  FeatureFlagField,
  FeatureFlagGroup,
} from "./featureFlagFieldTypes";

export function isFieldWired(field: FeatureFlagField): boolean {
  return field.wired !== false;
}

export function fieldLabelKey(field: FeatureFlagField): string {
  return `featureFlags.field.${field.field}.label`;
}

export function fieldHintKey(field: FeatureFlagField): string {
  return `featureFlags.field.${field.field}.hint`;
}

export function groupTitleKey(group: FeatureFlagGroup): string {
  return `featureFlags.group.${group.id}.title`;
}

export function groupDescriptionKey(group: FeatureFlagGroup): string {
  return `featureFlags.group.${group.id}.description`;
}

export function enumOptionLabelKey(
  field: FeatureFlagEnumField,
  option: FeatureFlagEnumOption,
): string {
  return `featureFlags.field.${field.field}.option.${option.i18nSuffix}`;
}

export const FEATURE_FLAG_GROUPS: readonly FeatureFlagGroup[] = [
  FLAG_GROUP_MCP,
  FLAG_GROUP_MEMORY,
  FLAG_GROUP_RETRIEVAL,
  FLAG_GROUP_REASONING,
  FLAG_GROUP_EFFICIENCY,
  FLAG_GROUP_EVALUATION,
  FLAG_GROUP_UX,
  FLAG_GROUP_ORCHESTRATION,
  FLAG_GROUP_WORKSPACE,
];
