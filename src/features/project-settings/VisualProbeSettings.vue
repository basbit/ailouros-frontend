<template>
  <div class="visual-probe-settings">
    <div class="field">
      <label class="checkbox-row">
        <input
          id="pf-visual-enabled"
          type="checkbox"
          :checked="form.swarm_visual_probe_enabled"
          @change="
            emit(
              'update:form',
              'swarm_visual_probe_enabled',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("visual.enabledLabel") }}</span>
      </label>
      <div class="hint">{{ t("visual.enabledHint") }}</div>
    </div>

    <fieldset class="field" :disabled="!form.swarm_visual_probe_enabled">
      <label class="field-label" for="pf-visual-base-url">
        {{ t("visual.baseUrlLabel") }}
      </label>
      <input
        id="pf-visual-base-url"
        :value="form.swarm_visual_base_url"
        type="text"
        placeholder="http://127.0.0.1:3000"
        @input="
          emit(
            'update:form',
            'swarm_visual_base_url',
            ($event.target as HTMLInputElement).value,
          )
        "
      />
      <div class="hint">{{ t("visual.baseUrlHint") }}</div>
    </fieldset>

    <fieldset class="field" :disabled="!form.swarm_visual_probe_enabled">
      <label class="field-label" for="pf-visual-start-command">
        {{ t("visual.startCommandLabel") }}
      </label>
      <input
        id="pf-visual-start-command"
        :value="form.swarm_visual_start_command"
        type="text"
        placeholder="npm run dev -- --host 127.0.0.1 --port {port}"
        @input="
          emit(
            'update:form',
            'swarm_visual_start_command',
            ($event.target as HTMLInputElement).value,
          )
        "
      />
      <div class="hint">{{ t("visual.startCommandHint") }}</div>
    </fieldset>

    <div class="visual-probe-settings__grid">
      <fieldset class="field" :disabled="!form.swarm_visual_probe_enabled">
        <label class="field-label" for="pf-visual-start-directory">
          {{ t("visual.startDirectoryLabel") }}
        </label>
        <FilePathPicker
          :model-value="form.swarm_visual_start_directory"
          placeholder="frontend"
          :directory="true"
          @update:model-value="
            (value) => emit('update:form', 'swarm_visual_start_directory', value)
          "
        />
      </fieldset>

      <fieldset class="field" :disabled="!form.swarm_visual_probe_enabled">
        <label class="field-label" for="pf-visual-ready-path">
          {{ t("visual.readyPathLabel") }}
        </label>
        <input
          id="pf-visual-ready-path"
          :value="form.swarm_visual_ready_path"
          type="text"
          placeholder="/"
          @input="
            emit(
              'update:form',
              'swarm_visual_ready_path',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </fieldset>
    </div>

    <fieldset class="field" :disabled="!form.swarm_visual_probe_enabled">
      <label class="field-label" for="pf-visual-pages">
        {{ t("visual.pagesLabel") }}
      </label>
      <textarea
        id="pf-visual-pages"
        :value="form.swarm_visual_pages"
        rows="4"
        placeholder="/&#10;/settings"
        @input="
          emit(
            'update:form',
            'swarm_visual_pages',
            ($event.target as HTMLTextAreaElement).value,
          )
        "
      ></textarea>
      <div class="hint">{{ t("visual.pagesHint") }}</div>
    </fieldset>

    <div class="field">
      <label class="checkbox-row">
        <input
          id="pf-visual-har"
          type="checkbox"
          :checked="form.swarm_visual_capture_har"
          :disabled="!form.swarm_visual_probe_enabled"
          @change="
            emit(
              'update:form',
              'swarm_visual_capture_har',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("visual.harLabel") }}</span>
      </label>
    </div>

    <div class="field">
      <label class="checkbox-row">
        <input
          id="pf-visual-trace"
          type="checkbox"
          :checked="form.swarm_visual_capture_trace"
          :disabled="!form.swarm_visual_probe_enabled"
          @change="
            emit(
              'update:form',
              'swarm_visual_capture_trace',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("visual.traceLabel") }}</span>
      </label>
    </div>

    <div class="visual-probe-settings__grid">
      <div class="field">
        <label class="checkbox-row">
          <input
            id="pf-visual-multimodal"
            type="checkbox"
            :checked="form.swarm_visual_multimodal_review"
            :disabled="!form.swarm_visual_probe_enabled"
            @change="
              emit(
                'update:form',
                'swarm_visual_multimodal_review',
                String(($event.target as HTMLInputElement).checked),
              )
            "
          />
          <span class="check-label">{{ t("visual.multimodalLabel") }}</span>
        </label>
        <div class="hint">{{ t("visual.multimodalHint") }}</div>
      </div>

      <fieldset class="field" :disabled="!form.swarm_visual_multimodal_review">
        <label class="field-label" for="pf-visual-max-images">
          {{ t("visual.maxImagesLabel") }}
        </label>
        <input
          id="pf-visual-max-images"
          :value="form.swarm_visual_max_review_images"
          type="number"
          min="1"
          max="12"
          step="1"
          @input="
            emit(
              'update:form',
              'swarm_visual_max_review_images',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </fieldset>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";
import FilePathPicker from "@/shared/components/FilePathPicker.vue";

defineProps<{
  form: {
    swarm_visual_probe_enabled: boolean;
    swarm_visual_base_url: string;
    swarm_visual_start_command: string;
    swarm_visual_start_directory: string;
    swarm_visual_ready_path: string;
    swarm_visual_pages: string;
    swarm_visual_capture_har: boolean;
    swarm_visual_capture_trace: boolean;
    swarm_visual_multimodal_review: boolean;
    swarm_visual_max_review_images: string;
  };
}>();

const emit = defineEmits<{
  "update:form": [field: string, value: string];
}>();

const { t } = useI18n();
</script>

<style scoped>
.visual-probe-settings {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.visual-probe-settings fieldset.field {
  border: 0;
  margin: 0;
  min-inline-size: 0;
  padding: 0;
}

.visual-probe-settings__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
}

@media (max-width: 640px) {
  .visual-probe-settings__grid {
    grid-template-columns: 1fr;
  }
}
</style>
