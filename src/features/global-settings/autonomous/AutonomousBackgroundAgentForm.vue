<template>
  <div>
    <div class="field">
      <label class="checkbox-row">
        <input
          id="swarm_background_agent"
          type="checkbox"
          :checked="enabled"
          @change="
            emit(
              'update:form',
              'swarm_background_agent',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("auto.backgroundAgentLabel") }}</span>
      </label>
      <div class="hint">
        {{ t("auto.backgroundAgentHint") }}
        <em>{{ t("auto.experimentalHint") }}</em>
      </div>
    </div>
    <div class="field">
      <label class="field-label" for="swarm_background_watch_paths">{{
        t("auto.watchPathsLabel")
      }}</label>
      <input
        id="swarm_background_watch_paths"
        type="text"
        placeholder="src,tests"
        :value="watchPaths"
        @input="
          emit(
            'update:form',
            'swarm_background_watch_paths',
            ($event.target as HTMLInputElement).value,
          )
        "
      />
      <div class="hint">
        {{ t("auto.watchPathsHint") }}
        <code>SWARM_BACKGROUND_AGENT_WATCH_PATHS</code>
      </div>
    </div>
    <AutonomousModelPickerField
      v-if="enabled"
      :label="t('auto.backgroundAgentModelLabel')"
      :provider="provider"
      :model-value="model"
      :connection="connection"
      :custom-placeholder="t('auto.modelIdPlaceholder')"
      env-code="SWARM_BACKGROUND_AGENT_MODEL"
      @update:provider="emit('update:form', 'swarm_background_agent_provider', $event)"
      @update:model-value="emit('update:form', 'swarm_background_agent_model', $event)"
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
  watchPaths: string;
  model: string;
  provider: string;
  connection: CloudConnection;
}>();

const emit = defineEmits<{
  "update:form": [field: string, value: string];
}>();
const { t } = useI18n();
</script>
