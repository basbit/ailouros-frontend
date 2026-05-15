<template>
  <div>
    <div class="field">
      <label class="checkbox-row">
        <input
          id="swarm_self_verify"
          type="checkbox"
          :checked="enabled"
          @change="
            emit(
              'update:form',
              'swarm_self_verify',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("auto.selfVerifyLabel") }}</span>
      </label>
      <div class="hint">
        {{ t("auto.selfVerifyHint") }}
        <code>SWARM_SELF_VERIFY</code>.
      </div>
    </div>
    <AutonomousModelPickerField
      :label="t('auto.selfVerifyModelLabel')"
      :provider="provider"
      :model-value="model"
      :connection="connection"
      :custom-placeholder="t('auto.modelIdPlaceholder')"
      env-code="SWARM_SELF_VERIFY_MODEL"
      @update:provider="emit('update:form', 'swarm_self_verify_provider', $event)"
      @update:model-value="emit('update:form', 'swarm_self_verify_model', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import AutonomousModelPickerField from "./AutonomousModelPickerField.vue";
import { useI18n } from "@/shared/lib/i18n";

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
}>();

const emit = defineEmits<{
  "update:form": [field: string, value: string];
}>();
const { t } = useI18n();
</script>
