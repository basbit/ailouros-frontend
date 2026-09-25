/**
 * Field/group shapes for the feature-flag settings screen.
 *
 * They live apart from `featureFlagGroups.ts` because every `flagGroup*.ts`
 * needs them while `featureFlagGroups.ts` imports every `flagGroup*.ts` to
 * assemble `FEATURE_FLAG_GROUPS` — declaring them there made each group module
 * a type-only import cycle (nine of the eleven `no-circular` hits that kept
 * `tsPreCompilationDeps` off in the main dependency-cruiser config).
 */
import type {
  BooleanSettingKey,
  StringSettingKey,
} from "@/shared/lib/global-search/types";

export type FeatureFlagBooleanKey = BooleanSettingKey;

export type FeatureFlagStringKey = StringSettingKey;

interface FeatureFlagBooleanField {
  kind: "boolean";
  field: FeatureFlagBooleanKey;
  envName: string;
  wired?: boolean;
}

interface FeatureFlagStringField {
  kind: "string";
  field: FeatureFlagStringKey;
  envName: string;
  placeholder?: string;
  wired?: boolean;
}

export interface FeatureFlagEnumOption {
  value: string;
  i18nSuffix: string;
}

export interface FeatureFlagEnumField {
  kind: "enum";
  field: FeatureFlagStringKey;
  envName: string;
  options: readonly FeatureFlagEnumOption[];
  wired?: boolean;
}

export type FeatureFlagField =
  | FeatureFlagBooleanField
  | FeatureFlagStringField
  | FeatureFlagEnumField;

export interface FeatureFlagGroup {
  id: string;
  fields: readonly FeatureFlagField[];
}
