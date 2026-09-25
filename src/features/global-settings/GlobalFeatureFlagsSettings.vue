<template>
  <div class="feature-flags">
    <details
      v-for="group in visibleGroups"
      :key="group.id"
      :open="isGroupOpen(group) ? true : undefined"
      :class="`feature-flag-group feature-flag-group-${group.id}`"
    >
      <summary @click.prevent="onSummaryClick(group)">
        {{ t(groupTitleKey(group)) }}
      </summary>
      <p class="feature-flag-group-description">
        {{ t(groupDescriptionKey(group)) }}
      </p>
      <div
        v-for="field in group.fields"
        :key="field.field"
        :class="[
          `feature-flag-field feature-flag-field-${field.kind}`,
          isFieldWired(field) ? '' : 'feature-flag-field-not-wired',
          workspaceOverrides.isOverridden(field.field)
            ? 'feature-flag-field-workspace-override'
            : '',
        ]"
      >
        <template v-if="field.kind === 'boolean'">
          <FeatureFlagBooleanField
            :field="field.field"
            :checked="readBooleanFieldValue(field)"
            :label-text="t(fieldLabelKey(field))"
            :hint-text="t(fieldHintKey(field))"
            :env-name="field.envName"
            :wired="isFieldWired(field)"
            :overridden="workspaceOverrides.isOverridden(field.field)"
            :show-override-toggle="Boolean(props.workspaceRoot)"
            @change="(checked) => writeBooleanFieldValue(field, checked)"
            @toggle-override="(checked) => toggleOverride(field, checked)"
          />
        </template>
        <template v-else-if="field.kind === 'enum'">
          <FeatureFlagLabel
            :for-id="`global_${field.field}`"
            :label-text="t(fieldLabelKey(field))"
            :wired="isFieldWired(field)"
            :overridden="workspaceOverrides.isOverridden(field.field)"
            :not-wired-hint="t('featureFlags.badge.notWired.hint')"
            :not-wired-label="t('featureFlags.badge.notWired.label')"
            :override-hint="t('featureFlags.badge.workspaceOverride.hint')"
            :override-label="t('featureFlags.badge.workspaceOverride.label')"
          />
          <select
            :id="`global_${field.field}`"
            :value="readStringFieldValue(field) as string"
            @change="
              writeStringFieldValue(field, ($event.target as HTMLSelectElement).value)
            "
          >
            <option
              v-for="option in field.options"
              :key="option.value"
              :value="option.value"
            >
              {{ t(enumOptionLabelKey(field, option)) }}
            </option>
          </select>
          <div class="feature-flag-hint">
            {{ t(fieldHintKey(field)) }} <code>{{ field.envName }}</code>
            <SettingSourceNote :field="field.field" />
          </div>
          <FeatureFlagOverrideToggle
            :visible="Boolean(props.workspaceRoot)"
            :overridden="workspaceOverrides.isOverridden(field.field)"
            :label="t('featureFlags.overrideToggle.label')"
            @change="(checked) => toggleOverride(field, checked)"
          />
        </template>
        <template v-else>
          <FeatureFlagLabel
            :for-id="`global_${field.field}`"
            :label-text="t(fieldLabelKey(field))"
            :wired="isFieldWired(field)"
            :overridden="workspaceOverrides.isOverridden(field.field)"
            :not-wired-hint="t('featureFlags.badge.notWired.hint')"
            :not-wired-label="t('featureFlags.badge.notWired.label')"
            :override-hint="t('featureFlags.badge.workspaceOverride.hint')"
            :override-label="t('featureFlags.badge.workspaceOverride.label')"
          />
          <input
            :id="`global_${field.field}`"
            type="text"
            :value="readStringFieldValue(field) as string"
            :placeholder="field.placeholder ?? ''"
            @input="
              writeStringFieldValue(field, ($event.target as HTMLInputElement).value)
            "
          />
          <div class="feature-flag-hint">
            {{ t(fieldHintKey(field)) }} <code>{{ field.envName }}</code>
            <SettingSourceNote :field="field.field" />
          </div>
          <FeatureFlagOverrideToggle
            :visible="Boolean(props.workspaceRoot)"
            :overridden="workspaceOverrides.isOverridden(field.field)"
            :label="t('featureFlags.overrideToggle.label')"
            @change="(checked) => toggleOverride(field, checked)"
          />
        </template>
      </div>
      <div v-if="group.id === 'retrieval'" class="feature-flag-group-status-cards">
        <slot name="retrieval-status" />
      </div>
      <div v-if="group.id === 'evaluation'" class="feature-flag-group-status-cards">
        <slot name="evaluation-status" />
      </div>
    </details>
    <p v-if="filterActive && !visibleGroups.length" class="feature-flags-empty">
      {{ t("featureFlags.filter.empty") }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import type { Ref } from "vue";
import FeatureFlagLabel from "@/features/global-settings/FeatureFlagLabel.vue";
import FeatureFlagOverrideToggle from "@/features/global-settings/FeatureFlagOverrideToggle.vue";
import FeatureFlagBooleanField from "@/features/global-settings/FeatureFlagBooleanField.vue";
import SettingSourceNote from "@/shared/components/settings-fields/SettingSourceNote.vue";
import {
  FEATURE_FLAG_GROUPS,
  enumOptionLabelKey,
  fieldHintKey,
  fieldLabelKey,
  groupDescriptionKey,
  groupTitleKey,
  isFieldWired,
  type FeatureFlagGroup,
} from "@/features/global-settings/featureFlagGroups";
import { useFeatureFlagFields } from "@/features/global-settings/useFeatureFlagFields";
import { useI18n } from "@/shared/lib/i18n";

type FeatureFlagField = FeatureFlagGroup["fields"][number];

const { t } = useI18n();
const groups = FEATURE_FLAG_GROUPS;

const props = defineProps<{
  workspaceRoot?: string;
  filterQuery?: string;
}>();

const workspaceRootRef = toRef(props, "workspaceRoot") as unknown as Ref<string>;
const {
  workspaceOverrides,
  readBooleanFieldValue,
  readStringFieldValue,
  writeBooleanFieldValue,
  writeStringFieldValue,
  toggleOverride,
} = useFeatureFlagFields(workspaceRootRef);

const normalizedFilter = computed(() => (props.filterQuery ?? "").trim().toLowerCase());
const filterActive = computed(() => normalizedFilter.value.length > 0);

// Groups the user opened by clicking their <summary>, independently of any
// filter. While a filter is active every visible group is force-opened
// below — that force-open must never be recorded here, otherwise clearing
// the filter could not tell "the user expanded this" apart from "the search
// matched this", and every matched group would stay open forever.
const manuallyOpenGroupIds = ref<Record<string, boolean>>({});

function isGroupOpen(group: FeatureFlagGroup): boolean {
  if (filterActive.value) return true;
  return manuallyOpenGroupIds.value[group.id] === true;
}

function onSummaryClick(group: FeatureFlagGroup): void {
  manuallyOpenGroupIds.value = {
    ...manuallyOpenGroupIds.value,
    [group.id]: !isGroupOpen(group),
  };
}

function fieldMatchesFilter(field: FeatureFlagField): boolean {
  const query = normalizedFilter.value;
  if (!query) return true;
  const label = t(fieldLabelKey(field)).toLowerCase();
  const hint = t(fieldHintKey(field)).toLowerCase();
  const envName = field.envName.toLowerCase();
  return label.includes(query) || hint.includes(query) || envName.includes(query);
}

const visibleGroups = computed(() => {
  if (!filterActive.value) return groups;
  return groups.filter((group) => group.fields.some(fieldMatchesFilter));
});
</script>

<style scoped>
.feature-flags {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.feature-flag-group {
  border: 1px solid var(--c-border, #ddd);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
}

.feature-flag-group > summary {
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.feature-flag-group-description {
  font-size: 0.9rem;
  color: var(--c-text-muted, #666);
  margin: 0.25rem 0 0.75rem;
}

.feature-flag-field {
  display: flex;
  flex-direction: column;
  margin: 0.5rem 0 1rem;
}

.feature-flag-field-boolean {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
}

.feature-flag-string-label {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.feature-flag-field-string input {
  width: 100%;
  max-width: 32rem;
  padding: 0.3rem 0.5rem;
}

.feature-flag-hint {
  font-size: 0.85rem;
  color: var(--c-text-muted, #666);
  margin-top: 0.25rem;
  width: 100%;
  flex-basis: 100%;
}

.feature-flag-hint code {
  background: var(--c-code-bg, #f4f4f4);
  padding: 0 0.25rem;
  border-radius: 3px;
}

.feature-flag-badge-not-wired {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.05rem 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--c-warning-text, #8a5a00);
  background: var(--c-warning-bg, #fff4d6);
  border: 1px solid var(--c-warning-border, #f0c34a);
  border-radius: 3px;
}

.feature-flag-field-not-wired {
  opacity: 0.65;
}

.feature-flag-field-not-wired input,
.feature-flag-field-not-wired select {
  background: var(--c-disabled-bg, #f9f9f9);
}

.feature-flag-badge-workspace-override {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.05rem 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--c-accent-text, #1e5fad);
  background: var(--c-accent-bg, #e4f0ff);
  border: 1px solid var(--c-accent-border, #6fa3e0);
  border-radius: 3px;
}

.feature-flag-field-workspace-override {
  border-left: 3px solid var(--c-accent-border, #6fa3e0);
  padding-left: 0.5rem;
}

.feature-flag-override-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.4rem;
  font-size: 0.8rem;
  color: var(--c-text-muted, #666);
  cursor: pointer;
  width: 100%;
  flex-basis: 100%;
}

.feature-flag-override-toggle input[type="checkbox"] {
  width: 0.9rem;
  height: 0.9rem;
}

.feature-flag-group-status-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.feature-flags-empty {
  margin: 0.5rem 0 0;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  color: var(--c-text-muted, #666);
  border: 1px dashed var(--c-border, #ddd);
  border-radius: 6px;
  text-align: center;
}
</style>
