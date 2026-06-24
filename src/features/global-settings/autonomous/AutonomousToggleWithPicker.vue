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
      :profile-options="profileOptions"
      :remote-profile="remoteProfile"
      :profiles="profiles"
      :profile-placeholder="profilePlaceholder"
      :cloud-profile-title="cloudProfileTitle"
      :custom-placeholder="modelCustomPlaceholder"
      :env-code="modelEnvCode"
      @update:provider="emit('update:form', providerField, $event)"
      @update:model-value="emit('update:form', modelField, $event)"
      @update:remote-profile="onRemoteProfile"
    />
  </div>
</template>

<script setup lang="ts">
import AutonomousModelPickerField from "./AutonomousModelPickerField.vue";
import type { RemoteProfileRow } from "@/entities/remote-profile";

interface CloudConnection {
  remote_api_provider: string;
  remote_api_key: string;
  remote_api_base_url: string;
}

const props = defineProps<{
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
  profileOptions?: { value: string; label: string }[];
  remoteProfile?: string;
  profiles?: RemoteProfileRow[];
  profileField?: string;
  profilePlaceholder?: string;
  cloudProfileTitle?: string;
}>();

function onRemoteProfile(value: string): void {
  if (props.profileField) emit("update:form", props.profileField, value);
}

const emit = defineEmits<{
  "update:form": [field: string, value: string];
}>();
</script>
