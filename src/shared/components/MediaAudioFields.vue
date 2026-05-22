<template>
  <div class="media-fields">
    <fieldset class="field" :disabled="!form.media_enabled">
      <div class="field">
        <label class="field-label" for="media_audio_provider">{{
          t("media.audioProviderLabel")
        }}</label>
        <select
          id="media_audio_provider"
          :value="form.media_audio_provider"
          @change="
            emit(
              'update:form',
              'media_audio_provider',
              ($event.target as HTMLSelectElement).value,
            )
          "
        >
          <option value="">{{ t("media.provider.none") }}</option>
          <option value="elevenlabs_tts">
            {{ t("media.provider.elevenlabs_tts") }}
          </option>
        </select>
      </div>
      <div class="field">
        <label class="field-label" for="media_audio_model">{{
          t("media.audioModelLabel")
        }}</label>
        <input
          id="media_audio_model"
          type="text"
          :value="form.media_audio_model"
          :placeholder="t('media.audioModelPlaceholder')"
          @input="
            emit(
              'update:form',
              'media_audio_model',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </div>
      <div class="field">
        <label class="field-label" for="media_audio_api_key">{{
          t("media.audioApiKeyLabel")
        }}</label>
        <input
          id="media_audio_api_key"
          type="password"
          autocomplete="off"
          :value="form.media_audio_api_key"
          @input="
            emit(
              'update:form',
              'media_audio_api_key',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </div>
      <div class="field">
        <label class="field-label" for="media_audio_voice">{{
          t("media.audioVoiceLabel")
        }}</label>
        <input
          id="media_audio_voice"
          type="text"
          :value="form.media_audio_voice"
          :placeholder="t('media.audioVoicePlaceholder')"
          @input="
            emit(
              'update:form',
              'media_audio_voice',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </div>
    </fieldset>
    <div v-if="!form.media_enabled" class="hint">
      {{ t("media.requiresEnabledHint") }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";
import "./media-fields.css";

interface MediaAudioFieldsForm {
  media_enabled: boolean;
  media_audio_provider: string;
  media_audio_model: string;
  media_audio_api_key: string;
  media_audio_voice: string;
}

defineProps<{ form: MediaAudioFieldsForm }>();

const emit = defineEmits<{
  "update:form": [field: string, value: string];
}>();

const { t } = useI18n();
</script>

<style scoped>
.media-fields .hint {
  font-size: 11px;
  color: var(--text3, #6b7280);
}
</style>
