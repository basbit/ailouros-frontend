<template>
  <label class="feature-flag-toggle">
    <input
      type="checkbox"
      :checked="checked"
      @change="emit('change', ($event.target as HTMLInputElement).checked)"
    />
    <span class="feature-flag-toggle-label">{{ labelText }}</span>
    <span
      v-if="!wired"
      class="feature-flag-badge-not-wired"
      :title="t('featureFlags.badge.notWired.hint')"
      >{{ t("featureFlags.badge.notWired.label") }}</span
    >
    <span
      v-if="overridden"
      class="feature-flag-badge-workspace-override"
      :title="t('featureFlags.badge.workspaceOverride.hint')"
      >{{ t("featureFlags.badge.workspaceOverride.label") }}</span
    >
  </label>
  <div class="feature-flag-hint">
    {{ hintText }} <code>{{ envName }}</code>
    <SettingSourceNote :field="field" />
  </div>
  <label v-if="showOverrideToggle" class="feature-flag-override-toggle">
    <input
      type="checkbox"
      :checked="overridden"
      @change="emit('toggle-override', ($event.target as HTMLInputElement).checked)"
    />
    <span>{{ t("featureFlags.overrideToggle.label") }}</span>
  </label>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";
import SettingSourceNote from "@/shared/components/settings-fields/SettingSourceNote.vue";
import type { StateKey } from "@/shared/lib/global-search/types";

defineProps<{
  field: StateKey;
  checked: boolean;
  labelText: string;
  hintText: string;
  envName: string;
  wired: boolean;
  overridden: boolean;
  showOverrideToggle: boolean;
}>();

const emit = defineEmits<{
  change: [checked: boolean];
  "toggle-override": [checked: boolean];
}>();

const { t } = useI18n();
</script>

<style scoped>
.feature-flag-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.feature-flag-toggle-label {
  font-weight: 500;
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
</style>
