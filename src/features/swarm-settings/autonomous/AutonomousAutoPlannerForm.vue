<template>
  <div>
    <div class="field">
      <label class="checkbox-row">
        <input
          id="swarm_auto_plan"
          type="checkbox"
          :checked="enabled"
          @change="
            emit(
              'update:form',
              'swarm_auto_plan',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("auto.autoPlanLabel") }}</span>
      </label>
      <div class="hint">
        {{ t("auto.autoPlanHint") }}
      </div>
    </div>
    <AutonomousModelPickerField
      v-if="enabled"
      :label="t('auto.plannerModelLabel')"
      :provider="provider"
      :model-value="model"
      :connection="connection"
      custom-placeholder="deepseek-r1:14b"
      @update:provider="emit('update:form', 'swarm_planner_provider', $event)"
      @update:model-value="emit('update:form', 'swarm_planner_model', $event)"
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
