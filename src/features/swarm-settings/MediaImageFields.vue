<template>
  <div class="media-fields">
    <div class="field">
      <label class="checkbox-row">
        <input
          id="media_enabled"
          type="checkbox"
          :checked="form.media_enabled"
          @change="
            emit(
              'update:form',
              'media_enabled',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("media.enabledLabel") }}</span>
      </label>
      <div class="hint">{{ t("media.enabledHint") }}</div>
    </div>

    <fieldset class="field" :disabled="!form.media_enabled">
      <div class="field">
        <label class="field-label" for="media_image_provider">{{
          t("media.imageProviderLabel")
        }}</label>
        <select
          id="media_image_provider"
          :value="form.media_image_provider"
          @change="
            emit(
              'update:form',
              'media_image_provider',
              ($event.target as HTMLSelectElement).value,
            )
          "
        >
          <option value="">{{ t("media.provider.none") }}</option>
          <option value="openai_images">
            {{ t("media.provider.openai_images") }}
          </option>
          <option value="local_sd">
            {{ t("media.provider.local_sd") }}
          </option>
        </select>
      </div>
      <div class="field">
        <label class="field-label" for="media_image_model">{{
          t("media.imageModelLabel")
        }}</label>
        <input
          id="media_image_model"
          type="text"
          :value="form.media_image_model"
          :placeholder="t('media.imageModelPlaceholder')"
          @input="
            emit(
              'update:form',
              'media_image_model',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </div>
      <div class="field">
        <label class="field-label" for="media_image_api_key">{{
          t("media.imageApiKeyLabel")
        }}</label>
        <input
          id="media_image_api_key"
          type="password"
          autocomplete="off"
          :value="form.media_image_api_key"
          :placeholder="t('media.imageApiKeyPlaceholder')"
          @input="
            emit(
              'update:form',
              'media_image_api_key',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </div>
    </fieldset>

    <fieldset class="field" :disabled="!form.media_enabled">
      <legend class="field-label">{{ t("media.budgetSectionLabel") }}</legend>
      <div class="field">
        <label class="field-label" for="media_budget_max_cost_usd">{{
          t("media.budgetMaxCostLabel")
        }}</label>
        <input
          id="media_budget_max_cost_usd"
          type="number"
          min="0"
          step="0.01"
          :value="form.media_budget_max_cost_usd"
          placeholder="0.50"
          @input="
            emit(
              'update:form',
              'media_budget_max_cost_usd',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </div>
      <div class="field">
        <label class="field-label" for="media_budget_max_attempts">{{
          t("media.budgetMaxAttemptsLabel")
        }}</label>
        <input
          id="media_budget_max_attempts"
          type="number"
          min="1"
          step="1"
          :value="form.media_budget_max_attempts"
          placeholder="3"
          @input="
            emit(
              'update:form',
              'media_budget_max_attempts',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </div>
      <div class="field">
        <label class="field-label" for="media_license_policy">{{
          t("media.licensePolicyLabel")
        }}</label>
        <select
          id="media_license_policy"
          :value="form.media_license_policy"
          @change="
            emit(
              'update:form',
              'media_license_policy',
              ($event.target as HTMLSelectElement).value,
            )
          "
        >
          <option value="permissive_only">
            {{ t("media.licenseChoice.permissive_only") }}
          </option>
          <option value="noncommercial_ok">
            {{ t("media.licenseChoice.noncommercial_ok") }}
          </option>
          <option value="any">{{ t("media.licenseChoice.any") }}</option>
        </select>
      </div>
    </fieldset>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

export interface MediaImageFieldsForm {
  media_enabled: boolean;
  media_image_provider: string;
  media_image_model: string;
  media_image_api_key: string;
  media_budget_max_cost_usd: string;
  media_budget_max_attempts: string;
  media_license_policy: string;
}

defineProps<{ form: MediaImageFieldsForm }>();

const emit = defineEmits<{
  "update:form": [field: string, value: string];
}>();

const { t } = useI18n();
</script>

<style scoped>
.media-fields {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed var(--border, #4b4138);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.media-fields fieldset {
  margin: 0;
  padding: 6px 8px;
  border: 1px solid var(--border, #4b4138);
  border-radius: var(--radius, 6px);
}
.media-fields fieldset[disabled] {
  opacity: 0.55;
}
</style>
