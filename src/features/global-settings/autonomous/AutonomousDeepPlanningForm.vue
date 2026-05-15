<template>
  <div>
    <div class="field">
      <label class="checkbox-row">
        <input
          id="swarm_deep_planning"
          type="checkbox"
          :checked="enabled"
          @change="
            emit(
              'update:form',
              'swarm_deep_planning',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("auto.deepPlanningLabel") }}</span>
      </label>
      <div class="hint">
        {{ t("auto.deepPlanningHint") }}
        Env: <code>SWARM_DEEP_PLANNING</code>
      </div>
    </div>
    <AutonomousModelPickerField
      :label="t('auto.deepPlanningModelLabel')"
      :provider="provider"
      :model-value="model"
      :connection="connection"
      :custom-placeholder="t('auto.modelIdPlaceholder')"
      env-code="SWARM_DEEP_PLANNING_MODEL"
      @update:provider="emit('update:form', 'swarm_deep_planning_provider', $event)"
      @update:model-value="emit('update:form', 'swarm_deep_planning_model', $event)"
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
