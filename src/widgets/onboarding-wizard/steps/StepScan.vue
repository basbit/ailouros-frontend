<template>
  <div class="wizard-body">
    <div class="wizard-field-row">
      <label class="wiz-label">{{ t("onboarding.workspace") }}</label>
      <FilePathPicker
        :model-value="localRoot"
        placeholder="/path/to/project"
        :directory="true"
        @update:model-value="emit('update:localRoot', $event)"
      />
    </div>
    <div class="wizard-actions">
      <button
        class="start-btn"
        :disabled="scanning || !localRoot"
        @click="emit('scan')"
      >
        {{ scanning ? t("onboarding.scanning") : t("onboarding.scanWorkspace") }}
      </button>
      <button
        class="btn-secondary"
        :disabled="preconfigurating || !localRoot"
        @click="emit('preconfigure')"
      >
        {{
          preconfigurating ? t("onboarding.analyzing") : t("onboarding.preconfigure")
        }}
      </button>
    </div>
    <div class="wiz-hint" style="margin-top: 8px">
      {{ t("onboarding.preconfigureHint") }}
    </div>
    <div v-if="scanError" class="wiz-error">{{ scanError }}</div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";
import FilePathPicker from "@/shared/components/FilePathPicker.vue";

defineProps<{
  localRoot: string;
  scanning: boolean;
  preconfigurating: boolean;
  scanError: string | null;
}>();

const emit = defineEmits<{
  "update:localRoot": [val: string];
  scan: [];
  preconfigure: [];
}>();

const { t } = useI18n();
</script>

<style src="./wizard-shared.css"></style>
