<template>
  <div>
    <div class="field">
      <label class="checkbox-row">
        <input
          :id="toggleField"
          type="checkbox"
          :checked="enabled"
          @change="
            emit(
              'update:form',
              toggleField,
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ toggleLabel }}</span>
      </label>
      <div class="hint">
        <slot name="hint">{{ toggleHint }}</slot>
      </div>
    </div>
    <AutonomousModelPickerField
      v-if="!showPickerOnlyWhenEnabled || enabled"
      :label="modelLabel"
      :provider="provider"
      :model-value="model"
      :connection="connection"
      :custom-placeholder="modelCustomPlaceholder"
      :env-code="modelEnvCode"
      @update:provider="emit('update:form', providerField, $event)"
      @update:model-value="emit('update:form', modelField, $event)"
    />
  </div>
</template>

<script setup lang="ts">
import AutonomousModelPickerField from "./AutonomousModelPickerField.vue";

interface CloudConnection {
  remote_api_provider: string;
  remote_api_key: string;
  remote_api_base_url: string;
}

defineProps<{
  enabled: boolean;
  model: string;
  provider: string;
  connection: CloudConnection;
  toggleField: string;
  toggleLabel: string;
  toggleHint: string;
  modelLabel: string;
  modelField: string;
  providerField: string;
  modelCustomPlaceholder: string;
  modelEnvCode?: string;
  showPickerOnlyWhenEnabled?: boolean;
}>();

const emit = defineEmits<{
  "update:form": [field: string, value: string];
}>();
</script>
