<template>
  <fieldset class="remote-section">
    <legend>{{ t("remoteControl.links.legend") }}</legend>
    <p class="hint">{{ t("remoteControl.links.intro") }}</p>
    <SettingsToggleField
      field="swarm_human_gate_enabled"
      env-name="SWARM_HUMAN_GATE_ENABLED"
      :label="t('remoteControl.links.enabled.label')"
      :help="t('remoteControl.links.enabled.help')"
    />
    <SettingsTextField
      field="swarm_telegram_ingress_public_base_url"
      env-name="SWARM_TELEGRAM_INGRESS_PUBLIC_BASE_URL"
      placeholder="https://swarm.example.com"
      :label="t('remoteControl.links.baseUrl.label')"
      :help="t('remoteControl.links.baseUrl.help')"
    />
    <SettingsSecretField
      field="swarm_action_link_secret"
      env-name="SWARM_ACTION_LINK_SECRET"
      generatable
      :label="t('remoteControl.links.secret.label')"
      :help="t('remoteControl.links.secret.help')"
    >
      <template #actions>
        <button
          type="button"
          data-test="rotate-action-link-secret"
          :disabled="!state.swarm_action_link_secret || rotation.rotating.value"
          @click="rotation.rotate()"
        >
          {{ t("remoteControl.links.rotate") }}
        </button>
      </template>
    </SettingsSecretField>
    <p v-if="rotation.rotated.value" class="hint" data-test="rotate-done">
      {{ t("remoteControl.links.rotated") }}
    </p>
    <p v-if="rotation.error.value" class="remote-section__error" role="alert" data-test="rotate-error">
      {{ t("remoteControl.links.rotateFailed", { reason: rotation.error.value }) }}
    </p>
    <SettingsTextField
      field="swarm_human_gate_notify_ttl_seconds"
      env-name="SWARM_HUMAN_GATE_NOTIFY_TTL_SECONDS"
      placeholder="3600"
      numeric
      :min="60"
      :max="604800"
      :label="t('remoteControl.links.ttl.label')"
      :help="t('remoteControl.links.ttl.help')"
    />
  </fieldset>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";
import { useGlobalSearchKeys } from "@/shared/lib/global-search-keys";
import SettingsToggleField from "@/shared/components/settings-fields/SettingsToggleField.vue";
import SettingsTextField from "@/shared/components/settings-fields/SettingsTextField.vue";
import SettingsSecretField from "@/shared/components/settings-fields/SettingsSecretField.vue";
import { useActionLinkSecretRotation } from "./useActionLinkSecretRotation";

const { t } = useI18n();
const { state } = useGlobalSearchKeys();
const rotation = useActionLinkSecretRotation();
</script>
